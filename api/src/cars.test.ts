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

  it("filters by made-up garage / dealership name", () => {
    const clause = buildSearchClause({ garage: "Midnight Motors", sort: "price_asc" });
    expect(clause.whereSql).toContain("g.name = ?");
    expect(clause.values).toEqual(["Midnight Motors"]);
  });

  it("matches free-text q against make, model, and trim", () => {
    const clause = buildSearchClause({ q: "GT3" });
    expect(clause.whereSql).toContain("cm.make LIKE ?");
    expect(clause.whereSql).toContain("cm.model LIKE ?");
    expect(clause.whereSql).toContain("cm.trim_name LIKE ?");
    expect(clause.values).toEqual(["%GT3%", "%GT3%", "%GT3%", "%GT3%"]);
  });

  it("applies year and Brad Coin ranges with year_asc sort", () => {
    const clause = buildSearchClause({
      bodyType: "SUV",
      fuel: "Petrol",
      yearMin: 2018,
      yearMax: 2024,
      coinMin: 100,
      coinMax: 800,
      sort: "year_asc",
    });
    expect(clause.whereSql).toContain("cm.body_type = ?");
    expect(clause.whereSql).toContain("cm.fuel = ?");
    expect(clause.whereSql).toContain("l.year >= ?");
    expect(clause.whereSql).toContain("l.year <= ?");
    expect(clause.whereSql).toContain("l.coin_price >= ?");
    expect(clause.whereSql).toContain("l.coin_price <= ?");
    expect(clause.values).toEqual(["SUV", "Petrol", 2018, 2024, 100, 800]);
    expect(clause.orderSql).toBe("ORDER BY l.year ASC, l.id ASC");
  });

  it("sorts by make/model name A–Z and Z–A", () => {
    expect(buildSearchClause({ sort: "name_asc" }).orderSql).toContain("cm.make ASC");
    expect(buildSearchClause({ sort: "name_desc" }).orderSql).toContain("cm.make DESC");
  });
});
