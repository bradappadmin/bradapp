import { describe, expect, it } from "vitest";
import {
  garageBayOwnedCountLabel,
  garageBayValueLabel,
  garageBayValueStats,
  sumGarageValue,
} from "./garage-value";

describe("sumGarageValue", () => {
  it("sums list / fair Brad Coin prices across the garage", () => {
    expect(sumGarageValue([])).toBe(0);
    expect(
      sumGarageValue([{ coinPrice: 120 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toBe(215);
  });
});

describe("garageBayValueStats", () => {
  it("counts currently held cars and sums listing coin prices", () => {
    expect(garageBayValueStats([])).toEqual({ ownedCount: 0, totalValue: 0 });
    expect(
      garageBayValueStats([{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toEqual({ ownedCount: 3, totalValue: 515 });
  });

  it("labels count and bay value for the strip", () => {
    expect(garageBayOwnedCountLabel(0)).toBe("0 cars in your bay");
    expect(garageBayOwnedCountLabel(1)).toBe("1 car in your bay");
    expect(garageBayOwnedCountLabel(4)).toBe("4 cars in your bay");
    expect(garageBayValueLabel(515, (n) => `${n} BC`)).toBe("Bay value 515 BC");
  });
});
