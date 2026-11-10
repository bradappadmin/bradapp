import { describe, expect, it } from "vitest";
import {
  carStudioImageUrl,
  paintOptionsFor,
  resolveStudioCarTokens,
  STUDIO_PAINT_COLOURS,
} from "./car-image";

describe("resolveStudioCarTokens", () => {
  it("maps Audi RS6 Estate to a6 + rs6 + estate", () => {
    expect(
      resolveStudioCarTokens({
        make: "Audi",
        model: "RS6",
        bodyType: "Estate",
        year: 2019,
        fuel: "Petrol",
      }),
    ).toEqual({
      make: "audi",
      modelFamily: "a6",
      modelRange: "rs6",
      modelVariant: "estate",
      modelYear: "2019",
      powerTrain: "petrol",
    });
  });

  it("maps BMW M3 Saloon to 3 series + m3", () => {
    expect(
      resolveStudioCarTokens({ make: "BMW", model: "M3", bodyType: "Saloon" }),
    ).toMatchObject({
      make: "bmw",
      modelFamily: "3 series",
      modelRange: "m3",
      modelVariant: "sedan",
    });
  });

  it("maps Civic Type R and Golf R performance lines", () => {
    expect(
      resolveStudioCarTokens({ make: "Honda", model: "Civic Type R", bodyType: "Hatchback" }),
    ).toMatchObject({
      modelFamily: "civic",
      modelRange: "type r",
      modelVariant: "hatchback",
    });
    expect(
      resolveStudioCarTokens({ make: "Volkswagen", model: "Golf R", bodyType: "Hatchback" }),
    ).toMatchObject({
      modelFamily: "golf",
      modelRange: "r",
    });
  });

  it("aliases Mercedes-AMG C 63 onto the mercedes c-class range", () => {
    expect(
      resolveStudioCarTokens({ make: "Mercedes-AMG", model: "C 63 S", bodyType: "Saloon" }),
    ).toMatchObject({
      make: "mercedes",
      modelFamily: "c-class",
      modelRange: "c 63",
      modelVariant: "sedan",
    });
  });
});

describe("carStudioImageUrl", () => {
  it("builds a studio URL from make, model, and paint", () => {
    const url = carStudioImageUrl({
      make: "Audi",
      model: "RS6",
      colour: "Racing Red",
      bodyType: "Estate",
      year: 2019,
      width: 400,
    });
    expect(url).toContain("cdn.imagin.studio/getImage");
    expect(url).toContain("make=audi");
    expect(url).toContain("modelFamily=a6");
    expect(url).toContain("modelRange=rs6");
    expect(url).toContain("modelVariant=estate");
    expect(url).toContain("modelYear=2019");
    expect(url).toContain("paintDescription=Red");
    expect(url).toContain("width=400");
    expect(url).toContain("fileType=webp");
  });

  it("aliases common UK makes for the studio CDN", () => {
    const url = carStudioImageUrl({ make: "Vauxhall", model: "Corsa", colour: "Laser Blue" });
    expect(url).toContain("make=opel");
    expect(url).toContain("paintDescription=Blue");
  });

  it("exposes a curated paint list that the studio helper accepts", () => {
    expect(STUDIO_PAINT_COLOURS).toContain("Racing Red");
    expect(STUDIO_PAINT_COLOURS).toContain("Midnight Black");
    expect(paintOptionsFor("Racing Red")[0]).toBe("Arctic White");
    expect(paintOptionsFor("Racing Red")).toEqual([...STUDIO_PAINT_COLOURS]);
    expect(paintOptionsFor("Custom Blue")[0]).toBe("Custom Blue");
    expect(paintOptionsFor("Custom Blue")).toContain("Racing Red");
    for (const colour of STUDIO_PAINT_COLOURS) {
      const url = carStudioImageUrl({ make: "BMW", model: "M3", colour, bodyType: "Saloon" });
      expect(url).toContain("paintDescription=");
      expect(url).toContain("modelRange=m3");
    }
  });

  it("skips the free demo studio URL for Ferrari (covered-car stub)", () => {
    expect(
      carStudioImageUrl({ make: "Ferrari", model: "SF90 Stradale", colour: "Racing Red" }),
    ).toBeNull();
  });
});
