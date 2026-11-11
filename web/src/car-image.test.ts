import { describe, expect, it } from "vitest";
import {
  carStudioImageUrl,
  carStudioSvgDataUrl,
  paintOptionsFor,
  resolveStudioCarTokens,
  STUDIO_PAINT_COLOURS,
  usesLicensedCarStudio,
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
  it("uses watermark-free white-studio SVG when no licensed customer is set", () => {
    expect(usesLicensedCarStudio()).toBe(false);
    const url = carStudioImageUrl({
      make: "Audi",
      model: "RS6",
      colour: "Racing Red",
      bodyType: "Estate",
      year: 2019,
      width: 400,
    });
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(url).not.toContain("cdn.imagin.studio");
    expect(url).not.toContain("customer=img");
    const decoded = decodeURIComponent(url!.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
    expect(decoded).toContain("#ffffff");
    expect(decoded).toContain("#dc2626");
  });

  it("builds the same SVG helper for UK make aliases and paint", () => {
    const url = carStudioSvgDataUrl({
      make: "Vauxhall",
      model: "Corsa",
      colour: "Laser Blue",
      bodyType: "Hatchback",
    });
    expect(url).toMatch(/^data:image\/svg\+xml/);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
    expect(decoded).toContain("#2563eb");
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
      expect(url).toMatch(/^data:image\/svg\+xml/);
    }
  });

  it("still renders Ferrari via white-studio SVG (no covered-car Imagin stub)", () => {
    const url = carStudioImageUrl({
      make: "Ferrari",
      model: "SF90 Stradale",
      colour: "Racing Red",
      bodyType: "Coupe",
    });
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(url).not.toContain("cdn.imagin.studio");
  });
});
