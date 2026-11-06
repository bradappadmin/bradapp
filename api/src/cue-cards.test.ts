import { describe, expect, it } from "vitest";
import { buildCueCards } from "./cue-cards.js";

describe("buildCueCards", () => {
  it("builds cue cards from a real car’s specs", () => {
    const cards = buildCueCards({
      make: "Porsche",
      model: "911",
      trimName: "GT3",
      bodyType: "Coupe",
      fuel: "Petrol",
      bhp: 503,
      topSpeedMph: 198,
      zeroToSixtySecs: 3.2,
    });
    expect(cards.length).toBeGreaterThanOrEqual(5);
    expect(cards.some((c) => c.prompt.includes("503"))).toBe(true);
    expect(cards.some((c) => c.prompt.toLowerCase().includes("verdict") || c.id === "verdict")).toBe(
      true,
    );
    expect(cards[0]?.prompt).toContain("Porsche 911");
  });
});
