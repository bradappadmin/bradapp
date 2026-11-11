import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { claimDailyLoginBonus, DAILY_LOGIN_BONUS, londonClaimDate } from "./coins.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import {
  LOGIN_STREAK_MILESTONES,
  asClaimDate,
  loginStreakBonusFor,
  nextLoginStreak,
  shiftClaimDate,
} from "./login-streak.js";
import { ensureUser, seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe("login streak helpers", () => {
  it("shifts claim dates by whole calendar days", () => {
    expect(shiftClaimDate("2026-11-10", -1)).toBe("2026-11-09");
    expect(shiftClaimDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftClaimDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("increments when yesterday was claimed, resets on a gap", () => {
    expect(
      nextLoginStreak({
        previousStreak: 2,
        lastClaimDate: "2026-11-09",
        claimDate: "2026-11-10",
      }),
    ).toBe(3);
    expect(
      nextLoginStreak({
        previousStreak: 4,
        lastClaimDate: "2026-11-08",
        claimDate: "2026-11-10",
      }),
    ).toBe(1);
    expect(
      nextLoginStreak({
        previousStreak: 0,
        lastClaimDate: null,
        claimDate: "2026-11-10",
      }),
    ).toBe(1);
    expect(
      nextLoginStreak({
        previousStreak: 3,
        lastClaimDate: "2026-11-10",
        claimDate: "2026-11-10",
      }),
    ).toBe(3);
  });

  it("awards documented day-3 and day-7 bonuses only on exact streaks", () => {
    expect(LOGIN_STREAK_MILESTONES).toEqual([
      { streak: 3, coins: 15 },
      { streak: 7, coins: 50 },
    ]);
    expect(loginStreakBonusFor(1)).toBe(0);
    expect(loginStreakBonusFor(3)).toBe(15);
    expect(loginStreakBonusFor(4)).toBe(0);
    expect(loginStreakBonusFor(7)).toBe(50);
  });

  it("normalizes claim dates from Date and strings", () => {
    expect(asClaimDate("2026-11-10")).toBe("2026-11-10");
    expect(asClaimDate(new Date("2026-11-10T12:00:00.000Z"))).toBe("2026-11-10");
    expect(asClaimDate(null)).toBeNull();
  });
});

describe.runIf(hasDb)("login streak ledger bonuses", () => {
  const email = `login-streak-${Date.now()}@example.com`;
  let userId = 0;

  beforeAll(async () => {
    await seedAccounts();
    userId = await ensureUser(email, "LoginStreak-123!", "Login Streak", "member");
    const pool = getPool();
    await pool.query(
      `UPDATE users
       SET login_streak = 0, login_streak_last_date = NULL, coin_balance = 100
       WHERE id = ?`,
      [userId],
    );
    await pool.query("DELETE FROM coin_ledger WHERE user_id = ?", [userId]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM coin_ledger WHERE user_id = ?", [userId]);
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("claims day 1, then day-3 streak bonus when consecutive, and stays idempotent", async () => {
    const day1 = "2026-11-08";
    const day2 = "2026-11-09";
    const day3 = "2026-11-10";

    const first = await claimDailyLoginBonus(userId, new Date(`${day1}T12:00:00.000Z`));
    expect(first.claimedJustNow).toBe(true);
    expect(first.streak).toBe(1);
    expect(first.streakBonusAwarded).toBe(0);
    expect(first.balance).toBe(100 + DAILY_LOGIN_BONUS);

    const again = await claimDailyLoginBonus(userId, new Date(`${day1}T18:00:00.000Z`));
    expect(again.claimedJustNow).toBe(false);
    expect(again.streak).toBe(1);
    expect(again.streakBonusAwarded).toBe(0);
    expect(again.balance).toBe(first.balance);

    const second = await claimDailyLoginBonus(userId, new Date(`${day2}T12:00:00.000Z`));
    expect(second.streak).toBe(2);
    expect(second.streakBonusAwarded).toBe(0);

    const third = await claimDailyLoginBonus(userId, new Date(`${day3}T12:00:00.000Z`));
    expect(third.streak).toBe(3);
    expect(third.streakBonusAwarded).toBe(15);
    expect(third.balance).toBe(100 + DAILY_LOGIN_BONUS * 3 + 15);

    const pool = getPool();
    const [ledger] = await pool.query(
      `SELECT delta, reason, note FROM coin_ledger
       WHERE user_id = ? AND reason = 'login_streak_bonus'
       ORDER BY id DESC LIMIT 1`,
      [userId],
    );
    const rows = ledger as Array<{ delta: number; reason: string; note: string }>;
    expect(rows[0]?.delta).toBe(15);
    expect(rows[0]?.note).toContain("×3");
  });

  it("resets the streak after a missed London day and awards day-7 later", async () => {
    const pool = getPool();
    // Simulate a gap: last claim was two days before “today”.
    const today = londonClaimDate(new Date("2026-11-20T12:00:00.000Z"));
    const twoDaysAgo = shiftClaimDate(today, -2);
    await pool.query(
      `UPDATE users
       SET login_streak = 5, login_streak_last_date = ?, coin_balance = 500
       WHERE id = ?`,
      [twoDaysAgo, userId],
    );

    const reset = await claimDailyLoginBonus(userId, new Date("2026-11-20T12:00:00.000Z"));
    expect(reset.streak).toBe(1);
    expect(reset.streakBonusAwarded).toBe(0);

    // Jump to day 7 of a fresh consecutive run.
    await pool.query(
      `UPDATE users
       SET login_streak = 6, login_streak_last_date = ?
       WHERE id = ?`,
      [shiftClaimDate("2026-11-27", -1), userId],
    );
    // Clear any same-day daily_login rows for the forced claim date.
    await pool.query(
      `DELETE FROM coin_ledger
       WHERE user_id = ? AND reason = 'daily_login' AND note = ?`,
      [userId, "Daily login 2026-11-27"],
    );
    const day7 = await claimDailyLoginBonus(userId, new Date("2026-11-27T12:00:00.000Z"));
    expect(day7.streak).toBe(7);
    expect(day7.streakBonusAwarded).toBe(50);

    const [ledger] = await pool.query(
      `SELECT delta, note FROM coin_ledger
       WHERE user_id = ? AND reason = 'login_streak_bonus' AND note LIKE '%×7%'
       ORDER BY id DESC LIMIT 1`,
      [userId],
    );
    const rows = ledger as Array<{ delta: number; note: string }>;
    expect(rows[0]?.delta).toBe(50);
  });
});
