import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("catalogue API sample fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("serves sample filters when the live API is unreachable", async () => {
    const api = await import("./api");
    const res = await api.fetchCarFilters();
    expect(api.getCatalogueSource()).toBe("sample");
    expect(res.filters.makes).toContain("Porsche");
    expect(res.filters.garages.length).toBeGreaterThan(0);
  });

  it("serves sample search results when /cars/search fails", async () => {
    const api = await import("./api");
    const res = await api.searchCars({ make: "Ford" });
    expect(api.getCatalogueSource()).toBe("sample");
    expect(res.total).toBeGreaterThan(0);
    expect(res.listings.every((l) => l.make === "Ford")).toBe(true);
  });

  it("serves a sample listing detail when the API is offline", async () => {
    const api = await import("./api");
    const res = await api.fetchListing(1);
    expect(api.getCatalogueSource()).toBe("sample");
    expect(res.listing.id).toBe(1);
    expect(res.favourited).toBe(false);
  });
});
