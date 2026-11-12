import { describe, expect, it } from "vitest";
import {
  buildSampleListings,
  sampleCarFilters,
  sampleListing,
  sampleModels,
  searchSampleCars,
} from "./catalogue-seed";

describe("catalogue-seed sample bay", () => {
  it("builds a non-empty available catalogue", () => {
    const listings = buildSampleListings();
    expect(listings.length).toBeGreaterThan(40);
    expect(listings.every((l) => l.status === "available")).toBe(true);
    expect(listings[0]?.id).toBe(1);
  });

  it("exposes filter options covering makes and garages", () => {
    const filters = sampleCarFilters();
    expect(filters.makes).toContain("Porsche");
    expect(filters.conditions).toEqual(["new", "used"]);
    expect(filters.garages.length).toBeGreaterThan(0);
    expect(filters.yearMin).toBeGreaterThan(2000);
    expect(filters.coinPriceMax).toBeGreaterThan(filters.coinPriceMin);
  });

  it("filters models by make", () => {
    const all = sampleModels();
    const porsche = sampleModels("Porsche");
    expect(all.length).toBeGreaterThan(porsche.length);
    expect(porsche).toContain("911");
    expect(porsche.every((m) => sampleModels().includes(m))).toBe(true);
  });

  it("searches and sorts by price ascending by default", () => {
    const res = searchSampleCars({ make: "Porsche" });
    expect(res.total).toBeGreaterThan(0);
    expect(res.listings.length).toBeGreaterThan(0);
    expect(res.listings.every((l) => l.make === "Porsche")).toBe(true);
    for (let i = 1; i < res.listings.length; i += 1) {
      expect(res.listings[i]!.coinPrice).toBeGreaterThanOrEqual(res.listings[i - 1]!.coinPrice);
    }
  });

  it("returns a listing detail by stable id", () => {
    const first = buildSampleListings()[0]!;
    const found = sampleListing(first.id);
    expect(found?.make).toBe(first.make);
    expect(found?.garageTagline).toBeTruthy();
    expect(sampleListing(999_999)).toBeNull();
  });
});
