import { describe, expect, it } from "vitest";
import {
  CARS_SORT_OPTIONS,
  DEFAULT_CARS_SORT,
  parseCarsSort,
} from "./cars-sort";
import { GARAGE_SORT_OPTIONS } from "./garage-sort";

describe("cars-sort", () => {
  it("defaults to lowest price", () => {
    expect(DEFAULT_CARS_SORT).toBe("price_asc");
    expect(parseCarsSort(null)).toBe("price_asc");
    expect(parseCarsSort(undefined)).toBe("price_asc");
    expect(parseCarsSort("")).toBe("price_asc");
    expect(parseCarsSort("bogus")).toBe("price_asc");
    expect(parseCarsSort("year_desc")).toBe("price_asc");
  });

  it("accepts highest/lowest price and name A–Z / Z–A", () => {
    expect(parseCarsSort("price_asc")).toBe("price_asc");
    expect(parseCarsSort("price_desc")).toBe("price_desc");
    expect(parseCarsSort("name_asc")).toBe("name_asc");
    expect(parseCarsSort("name_desc")).toBe("name_desc");
  });

  it("reuses shared garage bay labels", () => {
    expect(CARS_SORT_OPTIONS.map((o) => o.label)).toEqual(
      GARAGE_SORT_OPTIONS.map((o) => o.label),
    );
    expect(CARS_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Highest price",
      "Lowest price",
      "Name A–Z",
      "Name Z–A",
    ]);
    expect(CARS_SORT_OPTIONS.map((o) => o.value)).toEqual([
      "price_desc",
      "price_asc",
      "name_asc",
      "name_desc",
    ]);
  });
});
