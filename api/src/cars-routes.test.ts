import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("cars routes", () => {
  const app = createApp();

  beforeAll(async () => {
    await seedAccounts();
  });

  afterAll(async () => {
    await closePool();
  });

  it("returns filter options", async () => {
    const res = await request(app).get("/cars/filters");
    expect(res.status).toBe(200);
    expect(res.body.filters.makes).toContain("Porsche");
    expect(res.body.filters.conditions).toEqual(["new", "used"]);
  });

  it("searches listings with make and condition filters", async () => {
    const res = await request(app).get("/cars/search").query({ make: "Porsche", condition: "used" });
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.listings.every((l: { make: string }) => l.make === "Porsche")).toBe(true);
    expect(res.body.listings.every((l: { conditionType: string }) => l.conditionType === "used")).toBe(
      true,
    );
    expect(res.body.listings[0].coinPrice).toBeGreaterThan(0);
    expect(res.body.listings[0].garageName).toBeTruthy();
  });

  it("returns a listing detail", async () => {
    const search = await request(app).get("/cars/search").query({ limit: 1 });
    const id = search.body.listings[0].id as number;
    const res = await request(app).get(`/cars/listings/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.listing.id).toBe(id);
    expect(res.body.listing.bhp).toBeGreaterThan(0);
    expect(res.body.listing.ownerLabel).toBeTruthy();
  });

  it("filters models by make", async () => {
    const res = await request(app).get("/cars/models").query({ make: "BMW" });
    expect(res.status).toBe(200);
    expect(res.body.models.length).toBeGreaterThan(0);
    expect(res.body.models.every((m: string) => typeof m === "string")).toBe(true);
  });
});
