import { describe, expect, it } from "vitest";
import { reviewCarComparePick, reviewCompareLabel } from "./review-compare";

describe("review Compare tray picks", () => {
  it("queues a catalogue pick when listing id is known", () => {
    expect(
      reviewCarComparePick({
        make: "Porsche",
        model: "911",
        trimName: "GT3",
        listingId: 42,
        listingYear: 2022,
        listingCoinPrice: 420,
      }),
    ).toEqual({
      id: 42,
      make: "Porsche",
      model: "911",
      trimName: "GT3",
      year: 2022,
      coinPrice: 420,
    });
    expect(reviewCompareLabel(false)).toBe("Compare");
    expect(reviewCompareLabel(true)).toBe("In compare");
  });

  it("hides when listing id is missing", () => {
    expect(
      reviewCarComparePick({
        make: "Porsche",
        model: "911",
        trimName: "GT3",
        listingId: null,
        listingYear: null,
        listingCoinPrice: null,
      }),
    ).toBeNull();
    expect(
      reviewCarComparePick({
        make: "Porsche",
        model: "911",
        trimName: "GT3",
        listingId: 0,
        listingYear: 2022,
        listingCoinPrice: 100,
      }),
    ).toBeNull();
  });
});
