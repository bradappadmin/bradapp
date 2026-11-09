import { describe, expect, it } from "vitest";
import {
  badgeForStatus,
  carBadgeLabel,
  carBodyArt,
  carPaint,
  carSilhouettePath,
} from "./car-visuals";

describe("car visuals", () => {
  it("maps seed colours to metallic paint layers", () => {
    expect(carPaint("Racing Red").base).toBe("#dc2626");
    expect(carPaint("Racing Red").highlight).toMatch(/^#/);
    expect(carPaint("Midnight Black").base).toBe("#1a1f2a");
    expect(carPaint("Unknown Hue").base).toMatch(/^#/);
  });

  it("returns distinct layered body art per body type", () => {
    const coupe = carBodyArt("Coupe");
    const suv = carBodyArt("SUV");
    expect(coupe.body.startsWith("M")).toBe(true);
    expect(coupe.glass.startsWith("M")).toBe(true);
    expect(coupe.wheels).toHaveLength(2);
    expect(suv.body).not.toEqual(coupe.body);
    expect(carBodyArt("Spaceship").body).toBe(carBodyArt("Saloon").body);
    expect(carSilhouettePath("Coupe")).toBe(coupe.body);
  });

  it("labels price and owned badges", () => {
    expect(carBadgeLabel("price", "150 BC")).toBe("150 BC");
    expect(carBadgeLabel("owned")).toBe("Owned");
    expect(carBadgeLabel("for_sale", "200 BC")).toBe("Listed · 200 BC");
    expect(badgeForStatus("owned")).toBe("owned");
    expect(badgeForStatus("available", "for_sale")).toBe("for_sale");
  });
});
