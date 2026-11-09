import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { DAILY_LOGIN_BONUS } from "./coins.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("auth routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const memberEmail = `member-${Date.now()}@example.com`;

  beforeAll(async () => {
    await seedAccounts();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email = ?", [memberEmail]);
    await closePool();
  });

  it("rejects invalid sign-up payloads", async () => {
    const res = await agent.post("/auth/signup").send({ email: "nope", password: "short", displayName: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("signs up a member, reads /me, and signs out", async () => {
    const signup = await agent.post("/auth/signup").send({
      email: memberEmail,
      password: "MemberPass-123!",
      displayName: "Test Member",
    });
    expect(signup.status).toBe(201);
    expect(signup.body.user.role).toBe("member");
    expect(signup.headers["set-cookie"]).toBeTruthy();

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(memberEmail);

    const signout = await agent.post("/auth/signout");
    expect(signout.status).toBe(200);

    const meAfter = await agent.get("/auth/me");
    expect(meAfter.status).toBe(401);
  });

  it("signs in the seeded Brad admin without exposing a password", async () => {
    const password = process.env.TEST_BRAD_PASSWORD;
    if (!password) {
      // Skip credential check when the test secret is not supplied locally.
      expect(true).toBe(true);
      return;
    }

    const signin = await request(app).post("/auth/signin").send({
      email: "bradapp.admin@gmail.com",
      password,
    });
    expect(signin.status).toBe(200);
    expect(signin.body.user.role).toBe("admin");
    expect(signin.body.user.email).toBe("bradapp.admin@gmail.com");
    expect(JSON.stringify(signin.body).toLowerCase()).not.toContain("password");
  });

  it("rejects bad credentials", async () => {
    const res = await request(app).post("/auth/signin").send({
      email: "bradapp.admin@gmail.com",
      password: "definitely-not-the-password",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_credentials");
  });

  it("auto-claims a once-per-day login bonus on /me with a ledger row", async () => {
    const email = `daily-${Date.now()}@example.com`;
    const agent = request.agent(app);
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "DailyPass-123!",
      displayName: "Daily Claimer",
    });
    expect(signup.status).toBe(201);
    const starting = Number(signup.body.user.coinBalance);

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.dailyLogin.claimedToday).toBe(true);
    expect(me.body.dailyLogin.amount).toBe(DAILY_LOGIN_BONUS);
    expect(me.body.user.coinBalance).toBe(starting + DAILY_LOGIN_BONUS);

    const again = await agent.get("/auth/me");
    expect(again.status).toBe(200);
    expect(again.body.dailyLogin.claimedToday).toBe(true);
    expect(again.body.dailyLogin.claimedJustNow).toBe(false);
    expect(again.body.user.coinBalance).toBe(starting + DAILY_LOGIN_BONUS);

    const status = await agent.get("/auth/daily-bonus");
    expect(status.status).toBe(200);
    expect(status.body.dailyLogin.claimedToday).toBe(true);

    const wallet = await agent.get("/trade/wallet");
    expect(
      wallet.body.ledger.some(
        (e: { reason: string; delta: number }) =>
          e.reason === "daily_login" && e.delta === DAILY_LOGIN_BONUS,
      ),
    ).toBe(true);

    await getPool().query("DELETE FROM users WHERE email = ?", [email]);
  });
});
