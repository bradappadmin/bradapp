import { describe, expect, it } from "vitest";
import { prepareRematch, rematchPrompt } from "./top-trumps-rematch";

describe("top trumps rematch", () => {
  it("keeps the challenge opponent and clears both card picks", () => {
    expect(prepareRematch({ mode: "challenge", opponentUserId: 42 })).toEqual({
      mode: "challenge",
      opponentUserId: 42,
      listingId: "",
      opponentListingId: "",
    });
  });

  it("clears house rematch back to house with no cards selected", () => {
    expect(prepareRematch({ mode: "house", opponentUserId: 42 })).toEqual({
      mode: "house",
      opponentUserId: "",
      listingId: "",
      opponentListingId: "",
    });
  });

  it("names the rematch opponent in the prompt", () => {
    expect(rematchPrompt("house", null)).toBe(
      "Rematch vs the house. Pick a new card, then play.",
    );
    expect(rematchPrompt("challenge", "Sam")).toBe(
      "Rematch vs Sam. Pick new cards, then play.",
    );
  });
});
