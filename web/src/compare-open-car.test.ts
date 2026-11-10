import { describe, expect, it } from "vitest";
import {
  canOpenCompareCar,
  compareOpenCarAriaLabel,
  compareOpenCarHref,
  compareOpenCarLabel,
} from "./compare-open-car";

describe("compare-open-car", () => {
  it("links to the catalogue listing for a known id", () => {
    expect(canOpenCompareCar(9)).toBe(true);
    expect(compareOpenCarHref(9)).toBe("/cars/9");
    expect(compareOpenCarLabel()).toBe("Open car");
    expect(compareOpenCarAriaLabel("Porsche 911 GT3")).toBe("Open car Porsche 911 GT3");
  });

  it("hides for missing / invalid listing ids", () => {
    expect(canOpenCompareCar(null)).toBe(false);
    expect(canOpenCompareCar(0)).toBe(false);
    expect(canOpenCompareCar(undefined)).toBe(false);
    expect(canOpenCompareCar(Number.NaN)).toBe(false);
    expect(compareOpenCarHref(null)).toBeNull();
    expect(compareOpenCarHref(0)).toBeNull();
  });
});
