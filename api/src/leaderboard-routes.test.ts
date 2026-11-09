import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("leaderboard routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const email = `leader-${Date.now()}@example.com`;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "LeaderPass-123!",
      displayName: "Leaderboard Tester",
    });
    expect(signup.status).toBe(201);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM listings WHERE owner_user_id = (SELECT id FROM users WHERE email = ?)", [
      email,
    ]);
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("requires auth", async () => {
    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(401);
  });

  it("ranks active members by Brad Coin balance and includes win counts", async () => {
    const res = await agent.get("/leaderboard");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < res.body.entries.length; i += 1) {
      const entry = res.body.entries[i];
      expect(entry.rank).toBe(i + 1);
      expect(entry).toMatchObject({
        id: expect.any(Number),
        displayName: expect.any(String),
        coinBalance: expect.any(Number),
        topTrumpsWins: expect.any(Number),
      });
      expect(entry.bio === null || typeof entry.bio === "string").toBe(true);
      expect(entry.highlightCar === null || typeof entry.highlightCar === "object").toBe(true);
      if (entry.highlightCar) {
        expect(entry.highlightCar).toMatchObject({
          id: expect.any(Number),
          make: expect.any(String),
          model: expect.any(String),
          trimName: expect.any(String),
          bodyType: expect.any(String),
          colour: expect.any(String),
          coinPrice: expect.any(Number),
        });
      }
      if (i > 0) {
        expect(entry.coinBalance).toBeLessThanOrEqual(res.body.entries[i - 1].coinBalance);
      }
    }

    const self = res.body.entries.find(
      (e: { displayName: string }) => e.displayName === "Leaderboard Tester",
    );
    expect(self).toBeTruthy();
    expect(self.highlightCar).toBeNull();
  });

  it("picks the highest-priced owned car as the highlight (tie → lowest id)", async () => {
    const pool = getPool();
    const [userRows] = await pool.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const userId = Number(userRows[0]?.id);
    expect(userId).toBeGreaterThan(0);

    const [modelRows] = await pool.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM car_models ORDER BY id ASC LIMIT 1",
    );
    const modelId = Number(modelRows[0]?.id);
    expect(modelId).toBeGreaterThan(0);

    const [garageRows] = await pool.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM garages ORDER BY id ASC LIMIT 1",
    );
    const garageId = Number(garageRows[0]?.id);
    expect(garageId).toBeGreaterThan(0);

    const insertListing = async (coinPrice: number, colour: string, year: number) => {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO listings
          (car_model_id, garage_id, condition_type, year, colour, mileage, coin_price, owner_label, owner_user_id, status)
         VALUES (?, ?, 'used', ?, ?, 12000, ?, 'Leaderboard Tester', ?, 'owned')`,
        [modelId, garageId, year, colour, coinPrice, userId],
      );
      return Number(result.insertId);
    };

    const cheapId = await insertListing(100, "Racing Red", 2020);
    const dearId = await insertListing(500, "Laser Blue", 2022);

    try {
      const res = await agent.get("/leaderboard");
      expect(res.status).toBe(200);
      const self = res.body.entries.find(
        (e: { displayName: string }) => e.displayName === "Leaderboard Tester",
      );
      expect(self.highlightCar).toMatchObject({
        id: dearId,
        colour: "Laser Blue",
        coinPrice: 500,
      });
      expect(self.highlightCar.id).not.toBe(cheapId);
    } finally {
      await pool.query("DELETE FROM listings WHERE id IN (?, ?)", [cheapId, dearId]);
    }
  });
});
