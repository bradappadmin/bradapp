import { describe, expect, it } from "vitest";
import {
  COMPARE_SELECTION_LIMIT,
  compareHref,
  parseCompareSelection,
  toggleComparePick,
} from "./compare-selection";

function sample(id: number, make = "Porsche") {
  return {
    id,
    make,
    model: "911",
    trimName: "GT3",
    year: 2022,
    coinPrice: 400 + id,
  };
}

function memoryStorage(initial = ""): Storage {
  return {
    data: initial,
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
}

describe("compare selection", () => {
  it("parses picks and drops junk", () => {
    expect(parseCompareSelection(null)).toEqual([]);
    expect(parseCompareSelection("nope")).toEqual([]);
    const ok = sample(3);
    expect(parseCompareSelection(JSON.stringify([ok, { id: "x" }]))).toEqual([ok]);
  });

  it("toggles picks, caps at two, and builds compare href", () => {
    const storage = memoryStorage();
    const first = toggleComparePick(sample(1), storage);
    expect(first.added).toBe(true);
    expect(first.picks).toHaveLength(1);

    const second = toggleComparePick(sample(2), storage);
    expect(second.picks.map((p) => p.id)).toEqual([1, 2]);
    expect(compareHref(second.picks)).toBe("/compare?a=1&b=2");
    expect(COMPARE_SELECTION_LIMIT).toBe(2);

    const third = toggleComparePick(sample(3), storage);
    expect(third.picks.map((p) => p.id)).toEqual([1, 3]);

    const removed = toggleComparePick(sample(1), storage);
    expect(removed.added).toBe(false);
    expect(removed.picks.map((p) => p.id)).toEqual([3]);
  });
});
