import { describe, expect, it } from "vitest";
import { tradeOpenCarHref, tradeOpenCarLabel } from "./trade-open-car";

describe("trade Open car", () => {
  it("links the catalogue when listing id is known", () => {
    expect(tradeOpenCarHref(42)).toBe("/cars/42");
    expect(tradeOpenCarLabel()).toBe("Open car");
  });

  it("hides when listing id is missing", () => {
    expect(tradeOpenCarHref(null)).toBeNull();
    expect(tradeOpenCarHref(undefined)).toBeNull();
    expect(tradeOpenCarHref(0)).toBeNull();
    expect(tradeOpenCarHref(-1)).toBeNull();
  });
});
