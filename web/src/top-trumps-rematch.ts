/** Prep state after a finished Top Trumps match so the player can rematch. */

export type RematchPrep = {
  mode: "house" | "challenge";
  /** Kept for challenge rematches; cleared for house. */
  opponentUserId: number | "";
  /** Cleared so the player must pick a new card. */
  listingId: number | "";
  /** Cleared so the player must pick a new opposing card in challenge mode. */
  opponentListingId: number | "";
};

/**
 * Keep the same opponent (or house), wipe card picks so the rematch needs a new selection.
 */
export function prepareRematch(input: {
  mode: "house" | "challenge";
  opponentUserId: number | "";
}): RematchPrep {
  if (input.mode === "house") {
    return {
      mode: "house",
      opponentUserId: "",
      listingId: "",
      opponentListingId: "",
    };
  }
  return {
    mode: "challenge",
    opponentUserId: input.opponentUserId,
    listingId: "",
    opponentListingId: "",
  };
}

export function rematchPrompt(
  mode: "house" | "challenge",
  opponentDisplayName: string | null,
): string {
  if (mode === "house") {
    return "Rematch vs the house. Pick a new card, then play.";
  }
  const name = opponentDisplayName?.trim() || "your opponent";
  return `Rematch vs ${name}. Pick new cards, then play.`;
}
