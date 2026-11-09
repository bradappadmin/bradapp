import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db.js";

/** Starting Brad Coins for new members. */
export const MEMBER_STARTING_COINS = 200;
export const ADMIN_STARTING_COINS = 1000;

/** Brad Coins credited once per UTC calendar day when signed in. */
export const DAILY_LOGIN_BONUS = 25;

export type LedgerReason =
  | "seed"
  | "purchase"
  | "sale"
  | "admin_adjust"
  | "play_reward"
  | "daily_login";

export type DailyLoginStatus = {
  amount: number;
  claimDate: string;
  claimedToday: boolean;
  claimedJustNow: boolean;
  balance: number;
};

export async function getCoinBalance(userId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { coin_balance: number })[]>(
    "SELECT coin_balance FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!rows[0]) {
    throw new Error("User not found");
  }
  return Number(rows[0].coin_balance);
}

export async function applyCoinDelta(
  connection: PoolConnection,
  input: {
    userId: number;
    delta: number;
    reason: LedgerReason;
    listingId?: number | null;
    note?: string;
    createdByUserId?: number | null;
  },
): Promise<number> {
  const [rows] = await connection.query<(RowDataPacket & { coin_balance: number })[]>(
    "SELECT coin_balance FROM users WHERE id = ? FOR UPDATE",
    [input.userId],
  );
  const current = rows[0];
  if (!current) {
    throw new Error("User not found");
  }
  const next = Number(current.coin_balance) + input.delta;
  if (next < 0) {
    throw new Error("insufficient_coins");
  }
  await connection.query("UPDATE users SET coin_balance = ? WHERE id = ?", [next, input.userId]);
  await connection.query(
    `INSERT INTO coin_ledger
      (user_id, delta, balance_after, reason, listing_id, note, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.delta,
      next,
      input.reason,
      input.listingId ?? null,
      input.note ?? "",
      input.createdByUserId ?? null,
    ],
  );
  return next;
}

export async function creditSeedIfNeeded(
  userId: number,
  amount: number,
  note: string,
): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query<(RowDataPacket & { id: number })[]>(
      `SELECT id FROM coin_ledger
       WHERE user_id = ? AND reason = 'seed'
       LIMIT 1
       FOR UPDATE`,
      [userId],
    );
    if (existing.length === 0) {
      const [userRows] = await connection.query<(RowDataPacket & { coin_balance: number })[]>(
        "SELECT coin_balance FROM users WHERE id = ? FOR UPDATE",
        [userId],
      );
      if (!userRows[0]) {
        throw new Error("User not found");
      }
      // Only auto-seed when balance is still zero (fresh account).
      if (Number(userRows[0].coin_balance) === 0) {
        await applyCoinDelta(connection, {
          userId,
          delta: amount,
          reason: "seed",
          note,
        });
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** UTC calendar date YYYY-MM-DD for daily bonus uniqueness. */
export function utcClaimDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Credits the daily login bonus at most once per UTC day.
 * Idempotent: safe to call on every /me or sign-in.
 */
export async function claimDailyLoginBonus(
  userId: number,
  now = new Date(),
): Promise<DailyLoginStatus> {
  const claimDate = utcClaimDate(now);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query<(RowDataPacket & { id: number })[]>(
      `SELECT id FROM coin_ledger
       WHERE user_id = ?
         AND reason = 'daily_login'
         AND note = ?
       LIMIT 1
       FOR UPDATE`,
      [userId, `Daily login ${claimDate}`],
    );
    if (existing.length > 0) {
      const [balRows] = await connection.query<(RowDataPacket & { coin_balance: number })[]>(
        "SELECT coin_balance FROM users WHERE id = ? LIMIT 1",
        [userId],
      );
      await connection.commit();
      return {
        amount: DAILY_LOGIN_BONUS,
        claimDate,
        claimedToday: true,
        claimedJustNow: false,
        balance: Number(balRows[0]?.coin_balance ?? 0),
      };
    }

    const balance = await applyCoinDelta(connection, {
      userId,
      delta: DAILY_LOGIN_BONUS,
      reason: "daily_login",
      note: `Daily login ${claimDate}`,
    });
    await connection.commit();
    return {
      amount: DAILY_LOGIN_BONUS,
      claimDate,
      claimedToday: true,
      claimedJustNow: true,
      balance,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getDailyLoginStatus(
  userId: number,
  now = new Date(),
): Promise<DailyLoginStatus> {
  const claimDate = utcClaimDate(now);
  const pool = getPool();
  const [existing] = await pool.query<(RowDataPacket & { id: number })[]>(
    `SELECT id FROM coin_ledger
     WHERE user_id = ?
       AND reason = 'daily_login'
       AND note = ?
     LIMIT 1`,
    [userId, `Daily login ${claimDate}`],
  );
  const balance = await getCoinBalance(userId);
  return {
    amount: DAILY_LOGIN_BONUS,
    claimDate,
    claimedToday: existing.length > 0,
    claimedJustNow: false,
    balance,
  };
}

export async function listLedger(userId: number, limit = 20): Promise<
  Array<{
    id: number;
    delta: number;
    balanceAfter: number;
    reason: LedgerReason;
    listingId: number | null;
    note: string;
    createdAt: string;
  }>
> {
  const pool = getPool();
  const [rows] = await pool.query<
    (RowDataPacket & {
      id: number;
      delta: number;
      balance_after: number;
      reason: LedgerReason;
      listing_id: number | null;
      note: string;
      created_at: Date;
    })[]
  >(
    `SELECT id, delta, balance_after, reason, listing_id, note, created_at
     FROM coin_ledger
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    delta: Number(r.delta),
    balanceAfter: Number(r.balance_after),
    reason: r.reason,
    listingId: r.listing_id == null ? null : Number(r.listing_id),
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export type AdminCoinAdjustment = {
  id: number;
  userId: number;
  userDisplayName: string;
  userEmail: string;
  delta: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  createdByUserId: number | null;
  createdByDisplayName: string | null;
};

/** Recent admin balance corrections across the family — who changed whom. */
export async function listAdminCoinAdjustments(
  limit = 50,
): Promise<AdminCoinAdjustment[]> {
  const pool = getPool();
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const [rows] = await pool.query<
    (RowDataPacket & {
      id: number;
      user_id: number;
      user_display_name: string;
      user_email: string;
      delta: number;
      balance_after: number;
      note: string;
      created_at: Date;
      created_by_user_id: number | null;
      created_by_display_name: string | null;
    })[]
  >(
    `SELECT cl.id,
            cl.user_id,
            u.display_name AS user_display_name,
            u.email AS user_email,
            cl.delta,
            cl.balance_after,
            cl.note,
            cl.created_at,
            cl.created_by_user_id,
            actor.display_name AS created_by_display_name
     FROM coin_ledger cl
     INNER JOIN users u ON u.id = cl.user_id
     LEFT JOIN users actor ON actor.id = cl.created_by_user_id
     WHERE cl.reason = 'admin_adjust'
     ORDER BY cl.id DESC
     LIMIT ?`,
    [safeLimit],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    userDisplayName: r.user_display_name,
    userEmail: r.user_email,
    delta: Number(r.delta),
    balanceAfter: Number(r.balance_after),
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
    createdByUserId:
      r.created_by_user_id == null ? null : Number(r.created_by_user_id),
    createdByDisplayName: r.created_by_display_name,
  }));
}

export type { ResultSetHeader };
