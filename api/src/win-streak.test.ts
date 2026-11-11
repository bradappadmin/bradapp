import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { ensureUser, seedAccounts } from "./seed.js";
import {
  STREAK_MILESTONES,
  applyWinStreakUpdate,
  nextWinStreak,
  outcomeForPlayer,
  streakBonusFor,
} from "./win-streak.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe("win streak helpers", () => {
  it("increments on win, resets on loss, keeps on draw", () => {
    expect(nextWinStreak(0, "win")).toBe(1);
    expect(nextWinStreak(2, "win")).toBe(3);
    expect(nextWinStreak(4, "loss")).toBe(0);
    expect(nextWinStreak(4, "draw")).toBe(4);
  });

  it("awards documented milestone bonuses only on exact streaks", () => {
    expect(STREAK_MILESTONES).toEqual([
      { streak: 3, coins: 15 },
      { streak: 5, coins: 40 },
    ]);
    expect(streakBonusFor(1)).toBe(0);
    expect(streakBonusFor(3)).toBe(15);
    expect(streakBonusFor(4)).toBe(0);
    expect(streakBonusFor(5)).toBe(40);
  });

  it("maps match winner to player outcome", () => {
    expect(outcomeForPlayer("challenger", "challenger")).toBe("win");
    expect(outcomeForPlayer("opponent", "challenger")).toBe("loss");
    expect(outcomeForPlayer("draw", "challenger")).toBe("draw");
    expect(outcomeForPlayer("opponent", "opponent")).toBe("win");
  });
});

describe.runIf(hasDb)("win streak ledger bonuses", () => {
  const email = `streak-${Date.now()}@example.com`;
  let userId = 0;

  beforeAll(async () => {
    await seedAccounts();
    userId = await ensureUser(email, "StreakPass-123!", "Streak Tester", "member");
    const pool = getPool();
    await pool.query("UPDATE users SET tt_win_streak = 0, coin_balance = 100 WHERE id = ?", [userId]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(
      "DELETE FROM coin_ledger WHERE user_id = (SELECT id FROM (SELECT id FROM users WHERE email = ?) t)",
      [email],
    );
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("increments streak, awards 3-win bonus, then resets on loss", async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      let streak = await applyWinStreakUpdate(connection, { userId, outcome: "win" });
      expect(streak.current).toBe(1);
      expect(streak.bonusAwarded).toBe(0);

      streak = await applyWinStreakUpdate(connection, { userId, outcome: "win" });
      expect(streak.current).toBe(2);
      expect(streak.bonusAwarded).toBe(0);

      streak = await applyWinStreakUpdate(connection, { userId, outcome: "win" });
      expect(streak.current).toBe(3);
      expect(streak.bonusAwarded).toBe(15);

      streak = await applyWinStreakUpdate(connection, { userId, outcome: "draw" });
      expect(streak.current).toBe(3);

      streak = await applyWinStreakUpdate(connection, { userId, outcome: "loss" });
      expect(streak.current).toBe(0);
      expect(streak.bonusAwarded).toBe(0);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [ledger] = await pool.query(
      `SELECT delta, reason, note FROM coin_ledger
       WHERE user_id = ? AND reason = 'tt_streak_bonus'
       ORDER BY id DESC LIMIT 1`,
      [userId],
    );
    const rows = ledger as Array<{ delta: number; reason: string; note: string }>;
    expect(rows[0]?.delta).toBe(15);
    expect(rows[0]?.note).toContain("×3");
  });

  it("awards 5-win milestone bonus", async () => {
    const pool = getPool();
    await pool.query("UPDATE users SET tt_win_streak = 4 WHERE id = ?", [userId]);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const streak = await applyWinStreakUpdate(connection, { userId, outcome: "win" });
      expect(streak.current).toBe(5);
      expect(streak.bonusAwarded).toBe(40);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
});
