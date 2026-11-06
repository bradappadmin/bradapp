export const TOP_TRUMPS_CATEGORIES = ["bhp", "top_speed_mph", "zero_to_sixty_secs"] as const;

export type TopTrumpsCategory = (typeof TOP_TRUMPS_CATEGORIES)[number];

export type StatDirection = "higher" | "lower";

export const WIN_COINS = 25;
export const PLAY_COINS = 5;

export function isTopTrumpsCategory(value: string): value is TopTrumpsCategory {
  return (TOP_TRUMPS_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(category: TopTrumpsCategory): string {
  switch (category) {
    case "bhp":
      return "Power (BHP)";
    case "top_speed_mph":
      return "Top speed";
    case "zero_to_sixty_secs":
      return "0–60";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function categoryDirection(category: TopTrumpsCategory): StatDirection {
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

export type MatchWinner = "challenger" | "opponent" | "draw";

/** Stronger value wins: higher power/top speed, lower 0–60. */
export function decideWinner(
  category: TopTrumpsCategory,
  challengerValue: number,
  opponentValue: number,
): MatchWinner {
  const direction = categoryDirection(category);
  if (challengerValue === opponentValue) {
    return "draw";
  }
  if (direction === "higher") {
    return challengerValue > opponentValue ? "challenger" : "opponent";
  }
  return challengerValue < opponentValue ? "challenger" : "opponent";
}

export function rewardForResult(winner: MatchWinner, playedAs: "challenger" | "opponent"): number {
  if (winner === "draw") {
    return PLAY_COINS;
  }
  if (winner === playedAs) {
    return WIN_COINS;
  }
  return PLAY_COINS;
}
