import { describe, expect, it } from "vitest";
import type { ListingDetail } from "./cars";
import { buildCompareRows } from "./compare-specs";

function listing(overrides: Partial<ListingDetail> & { id: number }): ListingDetail {
  return {
    make: "Ford",
    model: "Focus",
    trimName: "ST",
    bodyType: "Hatchback",
    fuel: "Petrol",
    drivetrain: "FWD",
    bhp: 280,
    topSpeedMph: 155,
    zeroToSixtySecs: 5.7,
    conditionType: "used",
    year: 2020,
    colour: "Blue",
    mileage: 20000,
    coinPrice: 200,
    ownerLabel: "Bay",
    ownerUserId: null,
    status: "available",
    garageName: "Midnight",
    garageCity: "London",
    doors: 5,
    seats: 5,
    garageTagline: "Tune bay",
    ...overrides,
  };
}

describe("compare specs", () => {
  it("highlights numeric winners for price and performance", () => {
    const left = listing({
      id: 1,
      coinPrice: 150,
      bhp: 300,
      topSpeedMph: 160,
      zeroToSixtySecs: 5.0,
      year: 2021,
      mileage: 10000,
    });
    const right = listing({
      id: 2,
      coinPrice: 250,
      bhp: 250,
      topSpeedMph: 150,
      zeroToSixtySecs: 6.0,
      year: 2019,
      mileage: 30000,
    });
    const rows = buildCompareRows(left, right);
    expect(rows.find((r) => r.id === "price")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "bhp")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "top-speed")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "zero-sixty")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "year")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "mileage")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "colour")?.highlight).toBe("none");
  });
});
