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
    expect(Array.isArray(res.body.filters.garages)).toBe(true);
    expect(res.body.filters.garages.length).toBeGreaterThan(0);
    expect(res.body.filters.garages[0]).toEqual(
      expect.objectContaining({ name: expect.any(String), city: expect.any(String) }),
    );
  });

  it("filters search results by garage / dealership", async () => {
    const filters = await request(app).get("/cars/filters");
    const garageName = filters.body.filters.garages[0].name as string;
    const res = await request(app).get("/cars/search").query({ garage: garageName, limit: 20 });
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(
      res.body.listings.every((l: { garageName: string }) => l.garageName === garageName),
    ).toBe(true);
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

  it("free-text q matches make, model, or trim alongside other filters", async () => {
    const byMake = await request(app).get("/cars/search").query({ q: "Porsche", limit: 20 });
    expect(byMake.status).toBe(200);
    expect(byMake.body.total).toBeGreaterThan(0);
    expect(
      byMake.body.listings.every(
        (l: { make: string; model: string; trimName: string }) =>
          /porsche/i.test(`${l.make} ${l.model} ${l.trimName}`),
      ),
    ).toBe(true);

    const sample = byMake.body.listings[0] as {
      make: string;
      model: string;
      trimName: string;
    };
    const token = (sample.model || sample.make).slice(0, 3);
    expect(token.length).toBeGreaterThanOrEqual(2);
    const byToken = await request(app)
      .get("/cars/search")
      .query({ q: token, condition: "used", limit: 20 });
    expect(byToken.status).toBe(200);
    expect(byToken.body.total).toBeGreaterThan(0);
    const needle = token.toLowerCase();
    expect(
      byToken.body.listings.every(
        (l: {
          make: string;
          model: string;
          trimName: string;
          garageName: string;
          conditionType: string;
        }) =>
          l.conditionType === "used" &&
          `${l.make} ${l.model} ${l.trimName} ${l.garageName}`.toLowerCase().includes(needle),
      ),
    ).toBe(true);
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

  it("filters models by make to available stock only", async () => {
    const filters = await request(app).get("/cars/filters");
    const make = (filters.body.filters.makes as string[])[0];
    expect(make).toBeTruthy();
    const res = await request(app).get("/cars/models").query({ make });
    expect(res.status).toBe(200);
    expect(res.body.models.length).toBeGreaterThan(0);
    expect(res.body.models.every((m: string) => typeof m === "string")).toBe(true);
  });

  it("filters by year and Brad Coin ranges and sorts", async () => {
    const filters = await request(app).get("/cars/filters");
    const yearMin = filters.body.filters.yearMin as number;
    const coinMax = filters.body.filters.coinPriceMax as number;
    const res = await request(app).get("/cars/search").query({
      yearMin,
      yearMax: yearMin + 20,
      coinMin: 1,
      coinMax,
      sort: "year_asc",
      limit: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    const years = res.body.listings.map((l: { year: number }) => l.year);
    for (let i = 1; i < years.length; i += 1) {
      expect(years[i]).toBeGreaterThanOrEqual(years[i - 1]);
    }
  });

  it("returns an empty result set for an impossible filter combo", async () => {
    const res = await request(app).get("/cars/search").query({
      make: "Porsche",
      yearMin: 2099,
      coinMax: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.listings).toEqual([]);
  });
});
