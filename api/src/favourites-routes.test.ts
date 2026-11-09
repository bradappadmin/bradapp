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

describe.runIf(hasDb)("favourites routes", () => {
  const app = createApp();
  const member = request.agent(app);
  const email = `fav-${Date.now()}@example.com`;
  let listingId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await member.post("/auth/signup").send({
      email,
      password: "FavPass-123!",
      displayName: "Fav Member",
    });
    expect(signup.status).toBe(201);

    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 3 });
    expect(search.status).toBe(200);
    listingId = search.body.listings[0].id;
    expect(listingId).toBeTruthy();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("requires sign-in to list favourites", async () => {
    const res = await request(app).get("/favourites");
    expect(res.status).toBe(401);
  });

  it("saves, lists, and unsaves a listing", async () => {
    const before = await member.get(`/favourites/${listingId}`);
    expect(before.status).toBe(200);
    expect(before.body.favourited).toBe(false);

    const save = await member.post(`/favourites/${listingId}`);
    expect(save.status).toBe(200);
    expect(save.body.favourited).toBe(true);

    const again = await member.post(`/favourites/${listingId}`);
    expect(again.status).toBe(200);
    expect(again.body.favourited).toBe(true);

    const list = await member.get("/favourites");
    expect(list.status).toBe(200);
    expect(list.body.cars.some((c: { id: number }) => c.id === listingId)).toBe(true);
    const car = list.body.cars.find((c: { id: number }) => c.id === listingId);
    expect(car.make).toBeTruthy();
    expect(car.model).toBeTruthy();
    expect(car.favouritedAt).toBeTruthy();

    const status = await member.get(`/favourites/${listingId}`);
    expect(status.body.favourited).toBe(true);

    const detail = await member.get(`/cars/listings/${listingId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.favourited).toBe(true);

    const remove = await member.delete(`/favourites/${listingId}`);
    expect(remove.status).toBe(200);
    expect(remove.body.favourited).toBe(false);

    const after = await member.get("/favourites");
    expect(after.body.cars.some((c: { id: number }) => c.id === listingId)).toBe(false);
  });

  it("rejects favouriting a missing listing", async () => {
    const res = await member.post("/favourites/999999999");
    expect(res.status).toBe(404);
  });
});
