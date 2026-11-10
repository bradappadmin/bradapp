import { describe, expect, it } from "vitest";
import {
  reviewOpenCarAriaLabel,
  reviewOpenCarHref,
  reviewRelatedListingCars,
} from "./review-open-car";

const car = {
  id: 1,
  make: "Ford",
  model: "Focus",
  trimName: "ST",
  bodyType: "Hatchback",
  colour: "Midnight Black",
  bhp: 280,
  topSpeedMph: 155,
  zeroToSixtySecs: 5.7,
  listingId: 55 as number | null,
  listingYear: 2019 as number | null,
  listingCoinPrice: 120 as number | null,
};

describe("reviewRelatedListingCars", () => {
  it("returns cars with known listing ids", () => {
    expect(
      reviewRelatedListingCars({
        car: { ...car, listingId: 55 },
        carB: { ...car, id: 2, make: "Honda", model: "Civic", listingId: 77 },
      }).map((c) => c.listingId),
    ).toEqual([55, 77]);
  });

  it("hides cars without a listing", () => {
    expect(
      reviewRelatedListingCars({
        car: { ...car, listingId: null },
        carB: null,
      }),
    ).toEqual([]);
    expect(
      reviewRelatedListingCars({
        car: { ...car, listingId: 0 },
        carB: { ...car, listingId: -1 },
      }),
    ).toEqual([]);
  });
});

describe("reviewOpenCarHref", () => {
  it("builds the catalogue path and accessible label", () => {
    expect(reviewOpenCarHref(55)).toBe("/cars/55");
    expect(reviewOpenCarAriaLabel({ make: "Ford", model: "Focus" })).toBe("Open car Ford Focus");
  });
});
