import { describe, expect, it } from "vitest";
import {
  badgeForStatus,
  carBadgeLabel,
  carPaint,
  carSilhouettePath,
} from "./car-visuals";

describe("car visuals", () => {
  it("maps seed colours to paint fills", () => {
    expect(carPaint("Racing Red").fill).toBe("#dc2626");
    expect(carPaint("Midnight Black").fill).toBe("#1a1f2a");
    expect(carPaint("Unknown Hue").fill).toMatch(/^#/);
  });

  it("returns original silhouette paths per body type", () => {
    const coupe = carSilhouettePath("Coupe");
    const suv = carSilhouettePath("SUV");
    expect(coupe.startsWith("M")).toBe(true);
    expect(suv.startsWith("M")).toBe(true);
    expect(coupe).not.toEqual(suv);
    expect(carSilhouettePath("Spaceship")).toBe(carSilhouettePath("Saloon"));
  });

  it("labels price and owned badges", () => {
    expect(carBadgeLabel("price", "150 BC")).toBe("150 BC");
    expect(carBadgeLabel("owned")).toBe("Owned");
    expect(carBadgeLabel("for_sale", "200 BC")).toBe("Listed · 200 BC");
    expect(badgeForStatus("owned")).toBe("owned");
    expect(badgeForStatus("available", "for_sale")).toBe("for_sale");
  });
});
