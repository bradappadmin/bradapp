import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
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
      if (i > 0) {
        expect(entry.coinBalance).toBeLessThanOrEqual(res.body.entries[i - 1].coinBalance);
      }
    }

    const self = res.body.entries.find((e: { displayName: string }) => e.displayName === "Leaderboard Tester");
    expect(self).toBeTruthy();
  });
});
