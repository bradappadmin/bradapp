import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { applyCoinDelta } from "./coins.js";
import { getPool } from "./db.js";

/**
 * Milestone Brad Coin bonuses for consecutive Top Trumps wins (House + PvP).
 * Awarded only when the streak lands exactly on the milestone after a win.
 */
export const STREAK_MILESTONES = [
  { streak: 3, coins: 15 },
  { streak: 5, coins: 40 },
] as const;

export type MatchStreakOutcome = "win" | "loss" | "draw";

export type WinStreakUpdate = {
  previous: number;
  current: number;
  bonusAwarded: number;
  balance: number;
};

export function nextWinStreak(current: number, outcome: MatchStreakOutcome): number {
  const safe = Math.max(0, Math.trunc(current));
  switch (outcome) {
    case "win":
      return safe + 1;
    case "loss":
      return 0;
    case "draw":
      return safe;
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

/** Coins awarded when the new streak equals a milestone (else 0). */
export function streakBonusFor(streak: number): number {
  const hit = STREAK_MILESTONES.find((m) => m.streak === streak);
  return hit ? hit.coins : 0;
}

export function outcomeForPlayer(
  winner: "challenger" | "opponent" | "draw",
  playedAs: "challenger" | "opponent",
): MatchStreakOutcome {
  if (winner === "draw") return "draw";
  return winner === playedAs ? "win" : "loss";
}

/**
 * Update `tt_win_streak` inside an open transaction and credit milestone bonus.
 */
export async function applyWinStreakUpdate(
  connection: PoolConnection,
  input: {
    userId: number;
    outcome: MatchStreakOutcome;
    listingId?: number | null;
  },
): Promise<WinStreakUpdate> {
  const [rows] = await connection.query<(RowDataPacket & { tt_win_streak: number; coin_balance: number })[]>(
    "SELECT tt_win_streak, coin_balance FROM users WHERE id = ? FOR UPDATE",
    [input.userId],
  );
  const row = rows[0];
  if (!row) {
    throw new Error("User not found");
  }

  const previous = Number(row.tt_win_streak) || 0;
  const current = nextWinStreak(previous, input.outcome);
  await connection.query("UPDATE users SET tt_win_streak = ? WHERE id = ?", [
    current,
    input.userId,
  ]);

  const bonusAwarded = input.outcome === "win" ? streakBonusFor(current) : 0;
  let balance = Number(row.coin_balance);
  if (bonusAwarded > 0) {
    balance = await applyCoinDelta(connection, {
      userId: input.userId,
      delta: bonusAwarded,
      reason: "tt_streak_bonus",
      listingId: input.listingId ?? null,
      note: `Top Trumps win streak ×${current}`,
    });
  }

  return { previous, current, bonusAwarded, balance };
}

export async function getWinStreak(userId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { tt_win_streak: number })[]>(
    "SELECT tt_win_streak FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  return Number(rows[0]?.tt_win_streak) || 0;
}
