import { describe, expect, it } from "vitest";
import { sumGarageValue } from "./garage-value";

describe("sumGarageValue", () => {
  it("sums list / fair Brad Coin prices across the garage", () => {
    expect(sumGarageValue([])).toBe(0);
    expect(
      sumGarageValue([{ coinPrice: 120 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toBe(215);
  });
});
