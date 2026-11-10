import type { MatchHistoryItem } from "./api";

/**
 * Deep-link into `/play` for a rematch from match history.
 * House → house mode (no opponent). PvP → same opponent, with theirCar when known.
 */
export function matchHistoryRematchHref(match: MatchHistoryItem): string {
  if (match.mode === "house") {
    return "/play";
  }

  const opponentId = match.opponentUserId;
  if (opponentId == null || !Number.isFinite(opponentId) || opponentId <= 0) {
    return "/play";
  }

  const params = new URLSearchParams({ opponent: String(opponentId) });
  const theirCarId = match.theirCar.listingId;
  if (theirCarId != null && Number.isFinite(theirCarId) && theirCarId > 0) {
    params.set("theirCar", String(theirCarId));
  }
  return `/play?${params.toString()}`;
}

export function matchHistoryRematchLabel(match: MatchHistoryItem): string {
  if (match.mode === "house") return "Rematch vs house";
  return "Rematch";
}
