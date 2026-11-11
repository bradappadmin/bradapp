import { describe, expect, it } from "vitest";
import {
  DEFAULT_GARAGE_SORT,
  GARAGE_SORT_OPTIONS,
  parseGarageSort,
  sortGarageCars,
} from "./garage-sort";

const cars = [
  { id: 1, make: "Porsche", model: "911", trimName: "GT3", coinPrice: 420 },
  { id: 2, make: "Ford", model: "Focus", trimName: "ST", coinPrice: 400 },
  { id: 3, make: "Audi", model: "RS3", trimName: "", coinPrice: 420 },
];

describe("garage sort", () => {
  it("parses known sort keys and falls back to highest price", () => {
    expect(parseGarageSort("value_asc")).toBe("value_asc");
    expect(parseGarageSort("name_desc")).toBe("name_desc");
    expect(parseGarageSort(null)).toBe(DEFAULT_GARAGE_SORT);
    expect(parseGarageSort("nope")).toBe("value_desc");
  });

  it("exposes favourites-matching bay labels", () => {
    expect(GARAGE_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Highest price",
      "Lowest price",
      "Name A–Z",
      "Name Z–A",
    ]);
  });

  it("sorts by highest and lowest Brad Coin price", () => {
    expect(sortGarageCars(cars, "value_desc").map((c) => c.id)).toEqual([3, 1, 2]);
    expect(sortGarageCars(cars, "value_asc").map((c) => c.id)).toEqual([2, 3, 1]);
  });

  it("sorts by name A–Z and Z–A", () => {
    expect(sortGarageCars(cars, "name_asc").map((c) => c.make)).toEqual([
      "Audi",
      "Ford",
      "Porsche",
    ]);
    expect(sortGarageCars(cars, "name_desc").map((c) => c.make)).toEqual([
      "Porsche",
      "Ford",
      "Audi",
    ]);
  });
});
