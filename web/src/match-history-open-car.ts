import type { MatchHistoryCar } from "./api";

/**
 * Catalogue deep-link for a match-history car when a listing id is known.
 * Returns null when Open car should be hidden.
 */
export function matchHistoryOpenCarHref(
  car: Pick<MatchHistoryCar, "listingId">,
): string | null {
  const id = car.listingId;
  if (id == null || !Number.isFinite(id) || id <= 0) return null;
  return `/cars/${id}`;
}

export function matchHistoryOpenCarLabel(): string {
  return "Open car";
}
