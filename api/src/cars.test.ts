import { describe, expect, it } from "vitest";
import { SEED_CAR_MODELS, buildSeedListings } from "./car-seed-data.js";
import { buildSearchClause } from "./cars.js";

describe("car seed data", () => {
  it("includes everyday and performance cars with realistic specs", () => {
    expect(SEED_CAR_MODELS.length).toBeGreaterThanOrEqual(70);
    const makes = new Set(SEED_CAR_MODELS.map((c) => c.make));
    expect(makes.has("Porsche")).toBe(true);
    expect(makes.has("Ford")).toBe(true);
    expect(SEED_CAR_MODELS.some((c) => c.bhp >= 500)).toBe(true);
    expect(SEED_CAR_MODELS.every((c) => c.bhp > 0 && c.topSpeedMph > 0 && c.zeroToSixtySecs > 0)).toBe(
      true,
    );
  });

  it("builds made-up listings with coin prices and owners", () => {
    const listings = buildSeedListings();
    expect(listings.length).toBeGreaterThan(SEED_CAR_MODELS.length);
    expect(listings.every((l) => l.coinPrice > 0 && l.ownerLabel.length > 0)).toBe(true);
    expect(listings.some((l) => l.conditionType === "new")).toBe(true);
    expect(listings.some((l) => l.conditionType === "used")).toBe(true);
  });
});

describe("buildSearchClause", () => {
  it("filters available listings and sorts by price by default", () => {
    const clause = buildSearchClause({ make: "Porsche", condition: "used", coinMax: 500 });
    expect(clause.whereSql).toContain("l.status = 'available'");
    expect(clause.whereSql).toContain("cm.make = ?");
    expect(clause.whereSql).toContain("l.condition_type = ?");
    expect(clause.values).toEqual(["Porsche", "used", 500]);
    expect(clause.orderSql).toContain("coin_price");
  });
});
