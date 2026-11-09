import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { MEMBER_STARTING_COINS } from "./coins.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("members routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const email = `members-${Date.now()}@example.com`;
  let selfId = 0;
  let otherId = 0;
  let otherCarId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await agent
      .post("/auth/signup")
      .send({ email, password: "MembersPass-123!", displayName: "Members Tester" });
    expect(signup.status).toBe(201);
    selfId = Number(signup.body.user.id);

    const otherEmail = `members-other-${Date.now()}@example.com`;
    const other = await request(app)
      .post("/auth/signup")
      .send({ email: otherEmail, password: "MembersPass-123!", displayName: "Challenge Rival" });
    expect(other.status).toBe(201);
    otherId = Number(other.body.user.id);

    const otherAgent = request.agent(app);
    expect(
      (await otherAgent.post("/auth/signin").send({ email: otherEmail, password: "MembersPass-123!" }))
        .status,
    ).toBe(200);
    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 30 });
    const cheap = search.body.listings.find(
      (l: { coinPrice: number }) => l.coinPrice <= MEMBER_STARTING_COINS,
    );
    expect(cheap).toBeTruthy();
    otherCarId = Number(cheap!.id);
    expect((await otherAgent.post(`/trade/listings/${otherCarId}/buy`)).status).toBe(200);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email LIKE 'members-%@example.com'");
    await closePool();
  });

  it("lists members with role, balance, and car count", async () => {
    const res = await agent.get("/members");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
    const self = res.body.members.find((m: { id: number }) => m.id === selfId);
    expect(self).toMatchObject({
      displayName: "Members Tester",
      role: "member",
      carCount: 0,
    });
    expect(typeof self.coinBalance).toBe("number");
    expect(self).not.toHaveProperty("email");
    expect(self).not.toHaveProperty("password_hash");
    const rival = res.body.members.find((m: { id: number }) => m.id === otherId);
    expect(rival.carCount).toBeGreaterThanOrEqual(1);
  });

  it("returns a public member garage with cars and no secrets", async () => {
    // Unsigned request — garage pages are public.
    const res = await request(app).get(`/members/${otherId}`);
    expect(res.status).toBe(200);
    expect(res.body.member.id).toBe(otherId);
    expect(res.body.member.carCount).toBeGreaterThanOrEqual(1);
    expect(res.body.member).not.toHaveProperty("email");
    expect(res.body.member).not.toHaveProperty("passwordHash");
    expect(res.body.member).not.toHaveProperty("password_hash");
    const car = res.body.cars.find((c: { id: number }) => c.id === otherCarId);
    expect(car).toBeTruthy();
    expect(typeof car.coinPrice).toBe("number");
    expect(car).not.toHaveProperty("owner_user_id");
  });

  it("lists members without signing in", async () => {
    const res = await request(app).get("/members");
    expect(res.status).toBe(200);
    expect(res.body.members.length).toBeGreaterThan(0);
  });

  it("filters member cards by owner for Top Trumps challenges", async () => {
    const res = await agent.get("/play/cards/members").query({ ownerUserId: otherId });
    expect(res.status).toBe(200);
    expect(res.body.cards.length).toBeGreaterThanOrEqual(1);
    expect(res.body.cards.every((c: { ownerUserId: number }) => c.ownerUserId === otherId)).toBe(
      true,
    );
  });
});
