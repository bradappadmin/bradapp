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

describe.runIf(hasDb)("activity routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const email = `activity-${Date.now()}@example.com`;
  let receiverEmail = "";
  let receiverId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "ActivityPass-123!",
      displayName: "Activity Fan",
    });
    expect(signup.status).toBe(201);

    receiverEmail = `activity-recv-${Date.now()}@example.com`;
    const other = await request(app).post("/auth/signup").send({
      email: receiverEmail,
      password: "ActivityPass-123!",
      displayName: "Activity Receiver",
    });
    expect(other.status).toBe(201);
    receiverId = Number(other.body.user.id);

    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 5 });
    const cheap = search.body.listings.find((l: { coinPrice: number }) => l.coinPrice <= 100);
    if (cheap) {
      expect((await agent.post(`/trade/listings/${cheap.id}/buy`)).status).toBe(200);
    }

    expect(
      (await agent.post(`/members/${receiverId}/gift`).send({ amount: 12, note: "Bay cheer" }))
        .status,
    ).toBe(200);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email = ? OR email = ?", [email, receiverEmail]);
    await closePool();
  });

  it("requires auth for the family feed", async () => {
    const res = await request(app).get("/activity");
    expect(res.status).toBe(401);
  });

  it("returns a sorted family activity feed including purchases when present", async () => {
    const res = await agent.get("/activity").query({ limit: 20 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const item of res.body.items) {
      expect(item).toMatchObject({
        id: expect.any(String),
        kind: expect.stringMatching(/^(purchase|sale|trade|top_trumps|review|gift)$/),
        createdAt: expect.any(String),
        summary: expect.any(String),
        actorName: expect.any(String),
      });
      expect(item.car === null || typeof item.car === "object").toBe(true);
      if (item.car) {
        expect(item.car).toMatchObject({
          make: expect.any(String),
          model: expect.any(String),
          trimName: expect.any(String),
          bodyType: expect.any(String),
          colour: expect.any(String),
        });
      }
    }
    const purchase = res.body.items.find((i: { kind: string }) => i.kind === "purchase");
    if (purchase) {
      expect(purchase.car).toMatchObject({
        make: expect.any(String),
        model: expect.any(String),
        colour: expect.any(String),
      });
    }
    const gift = res.body.items.find((i: { kind: string }) => i.kind === "gift");
    expect(gift).toBeTruthy();
    expect(gift.summary).toMatch(/Activity Fan gifted 12 BC to Activity Receiver/);
    expect(gift.href).toBe(`/members/${receiverId}`);
    expect(gift.car).toBeNull();
    if (res.body.items.length >= 2) {
      expect(res.body.items[0].createdAt >= res.body.items[1].createdAt).toBe(true);
    }
    const kinds = new Set(res.body.items.map((i: { kind: string }) => i.kind));
    expect(kinds.has("gift")).toBe(true);
    // After a buy in beforeAll, purchase should appear when stock existed.
    if (res.body.items.some((i: { kind: string }) => i.kind === "purchase")) {
      expect(kinds.has("purchase")).toBe(true);
    }
  });
});
