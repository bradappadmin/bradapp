import { describe, expect, it } from "vitest";

/** Mirror of API higher/lower rules for UI copy checks. */
function direction(category: "bhp" | "top_speed_mph" | "zero_to_sixty_secs"): "higher" | "lower" {
  switch (category) {
    case "bhp":
    case "top_speed_mph":
      return "higher";
    case "zero_to_sixty_secs":
      return "lower";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

describe("top trumps UI rules", () => {
  it("matches higher/lower directions", () => {
    expect(direction("bhp")).toBe("higher");
    expect(direction("zero_to_sixty_secs")).toBe("lower");
  });
});
