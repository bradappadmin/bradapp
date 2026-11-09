import { describe, expect, it } from "vitest";
import { carStudioImageUrl } from "./car-image";

describe("carStudioImageUrl", () => {
  it("builds a studio URL from make, model, and paint", () => {
    const url = carStudioImageUrl({
      make: "Audi",
      model: "RS6",
      colour: "Racing Red",
      width: 400,
    });
    expect(url).toContain("cdn.imagin.studio/getImage");
    expect(url).toContain("make=audi");
    expect(url).toContain("modelFamily=rs6");
    expect(url).toContain("paintDescription=Red");
    expect(url).toContain("width=400");
    expect(url).toContain("fileType=webp");
  });

  it("aliases common UK makes for the studio CDN", () => {
    const url = carStudioImageUrl({ make: "Vauxhall", model: "Corsa", colour: "Laser Blue" });
    expect(url).toContain("make=opel");
    expect(url).toContain("paintDescription=Blue");
  });
});
