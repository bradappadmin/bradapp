import { describe, expect, it } from "vitest";
import {
  CARS_SORT_OPTIONS,
  DEFAULT_CARS_SORT,
  parseCarsSort,
} from "./cars-sort";

describe("cars-sort", () => {
  it("defaults to lowest price", () => {
    expect(DEFAULT_CARS_SORT).toBe("price_asc");
    expect(parseCarsSort(null)).toBe("price_asc");
    expect(parseCarsSort(undefined)).toBe("price_asc");
    expect(parseCarsSort("")).toBe("price_asc");
    expect(parseCarsSort("bogus")).toBe("price_asc");
  });

  it("accepts lowest, highest, and newest", () => {
    expect(parseCarsSort("price_asc")).toBe("price_asc");
    expect(parseCarsSort("price_desc")).toBe("price_desc");
    expect(parseCarsSort("year_desc")).toBe("year_desc");
  });

  it("exposes Midnight Garage catalogue labels", () => {
    expect(CARS_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Lowest price",
      "Highest price",
      "Newest",
    ]);
  });
});
