import { describe, expect, it } from "vitest";
import {
  memberGarageBayCountLabel,
  memberGarageBayValueLabel,
  memberGarageBayValueStats,
  sumMemberGarageValue,
} from "./member-garage-value";

describe("sumMemberGarageValue", () => {
  it("sums listing Brad Coin prices across garage cars", () => {
    expect(sumMemberGarageValue([])).toBe(0);
    expect(
      sumMemberGarageValue([{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toBe(515);
  });
});

describe("memberGarageBayValueStats", () => {
  it("counts cars and sums listing coin prices", () => {
    expect(memberGarageBayValueStats([])).toEqual({ carCount: 0, totalValue: 0 });
    expect(
      memberGarageBayValueStats([{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toEqual({ carCount: 3, totalValue: 515 });
  });

  it("labels count and bay value for the strip", () => {
    expect(memberGarageBayCountLabel(0)).toBe("0 cars in this bay");
    expect(memberGarageBayCountLabel(1)).toBe("1 car in this bay");
    expect(memberGarageBayCountLabel(4)).toBe("4 cars in this bay");
    expect(memberGarageBayValueLabel(515, (n) => `${n} BC`)).toBe("Bay value 515 BC");
  });
});
