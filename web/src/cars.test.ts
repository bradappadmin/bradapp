import { describe, expect, it } from "vitest";
import { formatCoins, formatMileage, listingTitle } from "./cars";

describe("car display helpers", () => {
  it("formats coins and mileage", () => {
    expect(formatCoins(1200)).toBe("1,200 BC");
    expect(formatMileage(15000)).toBe("15,000 mi");
  });

  it("builds listing titles", () => {
    expect(listingTitle({ make: "Porsche", model: "911", trimName: "GT3" })).toBe("Porsche 911 GT3");
  });
});
