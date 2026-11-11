import { describe, expect, it } from "vitest";
import { buildCueCards, buildDragRaceCueCards } from "./cue-cards.js";

const porsche = {
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  bodyType: "Coupe",
  fuel: "Petrol",
  bhp: 503,
  topSpeedMph: 198,
  zeroToSixtySecs: 3.2,
};

const mustang = {
  make: "Ford",
  model: "Mustang",
  trimName: "GT",
  bodyType: "Coupe",
  fuel: "Petrol",
  bhp: 450,
  topSpeedMph: 155,
  zeroToSixtySecs: 4.3,
};

describe("buildCueCards", () => {
  it("builds cue cards from a real car’s specs", () => {
    const cards = buildCueCards(porsche);
    expect(cards.length).toBeGreaterThanOrEqual(5);
    expect(cards.some((c) => c.prompt.includes("503"))).toBe(true);
    expect(cards.some((c) => c.prompt.toLowerCase().includes("verdict") || c.id === "verdict")).toBe(
      true,
    );
    expect(cards[0]?.prompt).toContain("Porsche 911");
  });
});

describe("buildDragRaceCueCards", () => {
  it("builds two-lane drag race cues naming both cars", () => {
    const cards = buildDragRaceCueCards(porsche, mustang);
    expect(cards.length).toBeGreaterThanOrEqual(5);
    expect(cards[0]?.prompt).toMatch(/versus/i);
    expect(cards.some((c) => c.prompt.includes("Porsche 911"))).toBe(true);
    expect(cards.some((c) => c.prompt.includes("Ford Mustang"))).toBe(true);
    expect(cards.some((c) => c.id === "verdict")).toBe(true);
  });
});
