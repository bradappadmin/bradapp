import { describe, expect, it } from "vitest";
import {
  RECENTLY_VIEWED_KEY,
  RECENTLY_VIEWED_LIMIT,
  clearRecentlyViewed,
  loadRecentlyViewed,
  parseRecentlyViewed,
  rememberRecentlyViewed,
} from "./recently-viewed";

function sample(id: number, make = "Porsche") {
  return {
    id,
    make,
    model: "911",
    trimName: "GT3",
    bodyType: "Coupe",
    colour: "Racing Red",
    year: 2022,
    bhp: 502,
    topSpeedMph: 197,
    zeroToSixtySecs: 3.2,
    coinPrice: 420,
    status: "available",
  };
}

describe("recently viewed cars", () => {
  it("parses stored listings and drops junk", () => {
    expect(parseRecentlyViewed(null)).toEqual([]);
    expect(parseRecentlyViewed("not-json")).toEqual([]);
    const ok = { ...sample(7), viewedAt: 1 };
    expect(parseRecentlyViewed(JSON.stringify([ok, { id: "x" }]))).toEqual([ok]);
  });

  it("remembers newest first, dedupes, and caps the list", () => {
    const storage = {
      data: "" as string,
      getItem() {
        return this.data || null;
      },
      setItem(_key: string, value: string) {
        this.data = value;
      },
      removeItem() {
        this.data = "";
      },
      clear() {
        this.data = "";
      },
      key() {
        return null;
      },
      get length() {
        return 0;
      },
    } as Storage;

    rememberRecentlyViewed(sample(1), storage, 100);
    rememberRecentlyViewed(sample(2), storage, 200);
    const again = rememberRecentlyViewed(sample(1, "BMW"), storage, 300);
    expect(again.map((c) => c.id)).toEqual([1, 2]);
    expect(again[0]?.make).toBe("BMW");

    for (let i = 10; i < 10 + RECENTLY_VIEWED_LIMIT + 2; i += 1) {
      rememberRecentlyViewed(sample(i), storage, i);
    }
    const capped = rememberRecentlyViewed(sample(99), storage, 999);
    expect(capped).toHaveLength(RECENTLY_VIEWED_LIMIT);
    expect(capped[0]?.id).toBe(99);
  });

  it("clears the stored list", () => {
    const storage = {
      data: "" as string,
      getItem() {
        return this.data || null;
      },
      setItem(_key: string, value: string) {
        this.data = value;
      },
      removeItem(key: string) {
        if (key === RECENTLY_VIEWED_KEY) this.data = "";
      },
      clear() {
        this.data = "";
      },
      key() {
        return null;
      },
      get length() {
        return 0;
      },
    } as Storage;

    rememberRecentlyViewed(sample(3), storage, 1);
    expect(loadRecentlyViewed(storage)).toHaveLength(1);
    clearRecentlyViewed(storage);
    expect(loadRecentlyViewed(storage)).toEqual([]);
  });
});
