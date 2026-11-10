import type { MatchHistoryItem } from "./api";

function validOpponentId(id: number | null | undefined): id is number {
  return id != null && Number.isFinite(id) && id > 0;
}

/**
 * Whether a history row can offer Rematch.
 * House always can. PvP needs a real opponent who is not the viewer.
 */
export function canMatchHistoryRematch(
  match: MatchHistoryItem,
  viewerUserId: number | null | undefined,
): boolean {
  if (match.mode === "house") return true;
  if (!validOpponentId(match.opponentUserId)) return false;
  if (viewerUserId != null && match.opponentUserId === viewerUserId) return false;
  return true;
}

/**
 * Deep-link into `/play` for a rematch from match history.
 * House → house mode (no opponent). PvP → `/play?opponent=` (+ theirCar when known).
 * Returns null when Rematch should be hidden (missing opponent or self).
 */
export function matchHistoryRematchHref(
  match: MatchHistoryItem,
  viewerUserId?: number | null,
): string | null {
  if (!canMatchHistoryRematch(match, viewerUserId ?? null)) {
    return null;
  }

  if (match.mode === "house") {
    return "/play";
  }

  if (!validOpponentId(match.opponentUserId)) {
    return null;
  }

  const params = new URLSearchParams({ opponent: String(match.opponentUserId) });
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
