import { describe, expect, it } from "vitest";
import type { ListingDetail } from "./cars";
import { buildCompareTrumpRows, numericWinner } from "./compare-specs";

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

describe("compare Top Trumps winners", () => {
  it("uses Play rules: higher Power / Top speed, lower 0–60, ties neutral", () => {
    expect(numericWinner(300, 250, "higher")).toBe("left");
    expect(numericWinner(250, 300, "higher")).toBe("right");
    expect(numericWinner(5.0, 6.0, "lower")).toBe("left");
    expect(numericWinner(197, 197, "higher")).toBe("tie");

    const rows = buildCompareTrumpRows(
      listing({ id: 1, bhp: 502, zeroToSixtySecs: 3.2, topSpeedMph: 197 }),
      listing({ id: 2, bhp: 591, zeroToSixtySecs: 3.6, topSpeedMph: 197 }),
    );
    expect(rows.map((r) => r.label)).toEqual(["Power", "0–60", "Top speed"]);
    expect(rows.find((r) => r.id === "bhp")?.highlight).toBe("right");
    expect(rows.find((r) => r.id === "zero-sixty")?.highlight).toBe("left");
    expect(rows.find((r) => r.id === "top-speed")?.highlight).toBe("tie");
  });
});
