import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";
import {
  ensurePreviousWeekCupAwarded,
  previousWeekWindow,
  WEEKLY_CUP_PRIZE,
  weekWindowContaining,
} from "./weekly-cup.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("weekly Top Trumps cup", () => {
  const app = createApp();
  const agent = request.agent(app);
  const email = `weekly-cup-${Date.now()}@example.com`;
  let userId = 0;
  let listingId = 0;
  const now = new Date();
  const prev = previousWeekWindow(now);
  const current = weekWindowContaining(now);

  beforeAll(async () => {
    await seedAccounts();
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "WeeklyCup-Pass-123!",
      displayName: "Cup Contender",
    });
    expect(signup.status).toBe(201);
    userId = Number(signup.body.user.id);

    const [rows] = await getPool().query<{ id: number }[]>(
      `SELECT id FROM listings ORDER BY id ASC LIMIT 1`,
    );
    listingId = Number(rows[0]?.id);
    expect(listingId).toBeGreaterThan(0);
    await getPool().query(
      `UPDATE listings SET owner_user_id = ?, owner_label = ?, status = 'owned' WHERE id = ?`,
      [userId, "Cup Contender", listingId],
    );

    // Two wins in the previous London week (house + synthetic PvP-style challenger win).
    await getPool().query(
      `INSERT INTO top_trumps_matches
        (challenger_user_id, opponent_user_id, challenger_listing_id, opponent_listing_id,
         opponent_make, opponent_model, opponent_trim, category, challenger_value, opponent_value,
         winner, coin_reward, mode, created_at)
       VALUES
        (?, NULL, ?, NULL, 'House', 'Pace', '', 'bhp', 400, 300, 'challenger', 25, 'house', ?),
        (?, NULL, ?, NULL, 'House', 'Pace', '', 'bhp', 400, 200, 'challenger', 25, 'house', ?)`,
      [
        userId,
        listingId,
        new Date(prev.startUtc.getTime() + 3600_000),
        userId,
        listingId,
        new Date(prev.startUtc.getTime() + 7200_000),
      ],
    );

    // One win in the current week so standings are non-empty.
    await getPool().query(
      `INSERT INTO top_trumps_matches
        (challenger_user_id, opponent_user_id, challenger_listing_id, opponent_listing_id,
         opponent_make, opponent_model, opponent_trim, category, challenger_value, opponent_value,
         winner, coin_reward, mode, created_at)
       VALUES (?, NULL, ?, NULL, 'House', 'Pace', '', 'bhp', 500, 100, 'challenger', 25, 'house', ?)`,
      [userId, listingId, new Date(current.startUtc.getTime() + 3600_000)],
    );

    await getPool().query(`DELETE FROM weekly_cup_awards WHERE week_key = ?`, [prev.weekKey]);
    await getPool().query(
      `DELETE FROM coin_ledger WHERE user_id = ? AND reason = 'weekly_cup' AND note LIKE ?`,
      [userId, `%${prev.weekKey}%`],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(`DELETE FROM weekly_cup_awards WHERE week_key = ?`, [prev.weekKey]);
    await pool.query(`DELETE FROM top_trumps_matches WHERE challenger_user_id = ?`, [userId]);
    await pool.query(`DELETE FROM coin_ledger WHERE user_id = ?`, [userId]);
    await pool.query(`UPDATE listings SET owner_user_id = NULL, status = 'available' WHERE id = ?`, [
      listingId,
    ]);
    await pool.query(`DELETE FROM users WHERE id = ?`, [userId]);
    await closePool();
  });

  it("awards last week’s cup once and is idempotent", async () => {
    const first = await ensurePreviousWeekCupAwarded(now);
    expect(first.weekKey).toBe(prev.weekKey);
    expect(first.alreadyAwarded).toBe(false);
    expect(first.winnerUserId).toBe(userId);
    expect(first.wins).toBe(2);
    expect(first.prizeAmount).toBe(WEEKLY_CUP_PRIZE);

    const second = await ensurePreviousWeekCupAwarded(now);
    expect(second.alreadyAwarded).toBe(true);
    expect(second.winnerUserId).toBe(userId);
    expect(second.prizeAmount).toBe(WEEKLY_CUP_PRIZE);

    const [ledger] = await getPool().query<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM coin_ledger
       WHERE user_id = ? AND reason = 'weekly_cup' AND note LIKE ?`,
      [userId, `%${prev.weekKey}%`],
    );
    expect(Number(ledger[0]?.c)).toBe(1);
  });

  it("returns this-week standings from the play weekly-cup route", async () => {
    const res = await agent.get("/play/top-trumps/weekly-cup");
    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe("Europe/London");
    expect(res.body.weekKey).toBe(current.weekKey);
    expect(res.body.prizeAmount).toBe(WEEKLY_CUP_PRIZE);
    const self = res.body.standings.find((s: { userId: number }) => s.userId === userId);
    expect(self).toBeTruthy();
    expect(self.wins).toBeGreaterThanOrEqual(1);
    expect(res.body.previousAward.weekKey).toBe(prev.weekKey);
    expect(res.body.previousAward.winnerUserId).toBe(userId);
  });
});
