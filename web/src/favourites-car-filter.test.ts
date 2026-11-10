import { describe, expect, it } from "vitest";
import type { FavouriteCar } from "./api";
import { filterFavouritesByCarQuery } from "./favourites-car-filter";

function car(
  partial: Partial<FavouriteCar> & Pick<FavouriteCar, "id" | "make" | "model">,
): FavouriteCar {
  return {
    trimName: "",
    bodyType: "Coupe",
    bhp: 200,
    topSpeedMph: 140,
    zeroToSixtySecs: 6,
    conditionType: "used",
    year: 2020,
    colour: "Black",
    mileage: 10000,
    coinPrice: 100,
    status: "available",
    ownerLabel: "Bay",
    garageName: "Bay",
    garageCity: "London",
    favouritedAt: "2026-11-10T00:00:00.000Z",
    ...partial,
  };
}

const rows: FavouriteCar[] = [
  car({ id: 1, make: "Porsche", model: "911", trimName: "GT3" }),
  car({ id: 2, make: "Audi", model: "RS6", trimName: "Avant" }),
  car({ id: 3, make: "Ford", model: "Focus", trimName: "ST" }),
];

describe("favourites-car-filter", () => {
  it("filters by make, model, and trim", () => {
    expect(filterFavouritesByCarQuery(rows, "").map((c) => c.id)).toEqual([1, 2, 3]);
    expect(filterFavouritesByCarQuery(rows, "porsche").map((c) => c.id)).toEqual([1]);
    expect(filterFavouritesByCarQuery(rows, "rs6").map((c) => c.id)).toEqual([2]);
    expect(filterFavouritesByCarQuery(rows, "gt3").map((c) => c.id)).toEqual([1]);
    expect(filterFavouritesByCarQuery(rows, "zzzz")).toEqual([]);
  });
});
