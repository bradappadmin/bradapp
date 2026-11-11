import { describe, expect, it } from "vitest";
import {
  DEFAULT_FAVOURITES_SORT,
  FAVOURITES_SORT_OPTIONS,
  parseFavouritesSort,
  sortFavouriteCars,
} from "./favourites-sort";

describe("favourites-sort", () => {
  it("defaults to highest price and exposes bay labels", () => {
    expect(DEFAULT_FAVOURITES_SORT).toBe("value_desc");
    expect(parseFavouritesSort(null)).toBe("value_desc");
    expect(parseFavouritesSort("bogus")).toBe("value_desc");
    expect(FAVOURITES_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Highest price",
      "Lowest price",
      "Name A–Z",
      "Name Z–A",
    ]);
  });

  it("sorts by price and name like the garage bay", () => {
    const cars = [
      { make: "Porsche", model: "911", trimName: "GT3", coinPrice: 420 },
      { make: "Audi", model: "RS6", trimName: "Avant", coinPrice: 310 },
      { make: "Ford", model: "Focus", trimName: "ST", coinPrice: 80 },
    ];

    expect(sortFavouriteCars(cars, "value_asc").map((c) => c.make)).toEqual([
      "Ford",
      "Audi",
      "Porsche",
    ]);
    expect(sortFavouriteCars(cars, "name_asc").map((c) => c.make)).toEqual([
      "Audi",
      "Ford",
      "Porsche",
    ]);
    expect(sortFavouriteCars(cars, "name_desc").map((c) => c.make)).toEqual([
      "Porsche",
      "Ford",
      "Audi",
    ]);
  });
});
