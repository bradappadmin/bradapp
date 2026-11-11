import { describe, expect, it } from "vitest";
import {
  favouritesBayCountLabel,
  favouritesBayValueLabel,
  favouritesBayValueStats,
  sumFavouritesValue,
} from "./favourites-value";

describe("sumFavouritesValue", () => {
  it("sums listing Brad Coin prices across favourites", () => {
    expect(sumFavouritesValue([])).toBe(0);
    expect(
      sumFavouritesValue([{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toBe(515);
  });
});

describe("favouritesBayValueStats", () => {
  it("counts favourites and sums listing coin prices", () => {
    expect(favouritesBayValueStats([])).toEqual({ favouriteCount: 0, totalValue: 0 });
    expect(
      favouritesBayValueStats([{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]),
    ).toEqual({ favouriteCount: 3, totalValue: 515 });
  });

  it("labels count and favourites value for the strip", () => {
    expect(favouritesBayCountLabel(0)).toBe("0 favourites saved");
    expect(favouritesBayCountLabel(1)).toBe("1 favourite saved");
    expect(favouritesBayCountLabel(4)).toBe("4 favourites saved");
    expect(favouritesBayValueLabel(515, (n) => `${n} BC`)).toBe("Favourites value 515 BC");
  });
});
