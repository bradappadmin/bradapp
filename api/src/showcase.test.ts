import { describe, expect, it } from "vitest";
import { resolveShowcaseCar } from "./showcase.js";

describe("resolveShowcaseCar", () => {
  const cars = [
    { id: 10, coinPrice: 200, name: "Focus" },
    { id: 11, coinPrice: 520, name: "RS3" },
    { id: 9, coinPrice: 420, name: "911" },
  ];

  it("returns null for an empty garage", () => {
    expect(resolveShowcaseCar([], 11)).toBeNull();
  });

  it("prefers a pinned listing still in the set", () => {
    const result = resolveShowcaseCar(cars, 9);
    expect(result).toEqual({ car: cars[2], source: "pinned" });
  });

  it("falls back to highest value when pin is missing", () => {
    const result = resolveShowcaseCar(cars, 99);
    expect(result?.source).toBe("highest_value");
    expect(result?.car.id).toBe(11);
  });

  it("falls back to highest value when unpinned", () => {
    const result = resolveShowcaseCar(cars, null);
    expect(result?.car.id).toBe(11);
    expect(result?.source).toBe("highest_value");
  });

  it("breaks value ties with the lowest listing id", () => {
    const tied = [
      { id: 5, coinPrice: 300 },
      { id: 3, coinPrice: 300 },
      { id: 8, coinPrice: 100 },
    ];
    expect(resolveShowcaseCar(tied, null)?.car.id).toBe(3);
  });
});
