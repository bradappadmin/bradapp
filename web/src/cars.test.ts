import { describe, expect, it } from "vitest";
import {
  activeFilterChips,
  clearFilterChip,
  formatCoins,
  formatMileage,
  hasActiveFilters,
  listingTitle,
} from "./cars";

describe("car display helpers", () => {
  it("formats coins and mileage", () => {
    expect(formatCoins(1200)).toBe("1,200 BC");
    expect(formatMileage(15000)).toBe("15,000 mi");
  });

  it("builds listing titles", () => {
    expect(listingTitle({ make: "Porsche", model: "911", trimName: "GT3" })).toBe("Porsche 911 GT3");
  });
});

describe("search filter helpers", () => {
  it("detects active filters and builds chips", () => {
    expect(hasActiveFilters({ sort: "price_asc" })).toBe(false);
    expect(
      hasActiveFilters({
        make: "Porsche",
        yearMin: "2018",
        yearMax: "2022",
        coinMin: "100",
        coinMax: "500",
        condition: "used",
      }),
    ).toBe(true);

    const chips = activeFilterChips({
      make: "Porsche",
      model: "911",
      bodyType: "Coupe",
      fuel: "Petrol",
      condition: "used",
      yearMin: "2018",
      yearMax: "2022",
      coinMin: "100",
      coinMax: "500",
      sort: "year_asc",
    });
    expect(chips.map((c) => c.label)).toEqual([
      "Porsche",
      "911",
      "Coupe",
      "Petrol",
      "Used",
      "Year 2018–2022",
      "Price 100 BC–500 BC",
    ]);
  });

  it("clears year and coin ranges as pairs", () => {
    const base = {
      make: "BMW",
      yearMin: "2015",
      yearMax: "2020",
      coinMin: "50",
      coinMax: "200",
    };
    expect(clearFilterChip(base, "yearMin")).toMatchObject({
      make: "BMW",
      yearMin: "",
      yearMax: "",
      coinMin: "50",
      coinMax: "200",
    });
    expect(clearFilterChip(base, "coinMax")).toMatchObject({
      make: "BMW",
      coinMin: "",
      coinMax: "",
    });
    expect(clearFilterChip(base, "make").make).toBe("");
  });
});
