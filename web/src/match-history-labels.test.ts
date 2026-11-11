import { describe, expect, it } from "vitest";
import {
  formatMatchCarTitle,
  matchResultLabel,
  topTrumpsCategoryLabel,
} from "./match-history-labels";

describe("match history labels", () => {
  it("labels categories and results", () => {
    expect(topTrumpsCategoryLabel("bhp")).toBe("Power (BHP)");
    expect(topTrumpsCategoryLabel("top_speed_mph")).toBe("Top speed");
    expect(topTrumpsCategoryLabel("zero_to_sixty_secs")).toBe("0–60");
    expect(matchResultLabel("win")).toBe("Win");
    expect(matchResultLabel("loss")).toBe("Loss");
    expect(matchResultLabel("draw")).toBe("Draw");
  });

  it("formats car titles", () => {
    expect(formatMatchCarTitle({ make: "Ford", model: "Focus", trimName: "ST" })).toBe(
      "Ford Focus ST",
    );
    expect(formatMatchCarTitle({ make: "House", model: "card", trimName: "" })).toBe("House card");
  });
});
