/**
 * Catalogue deep-link for a trade car when a listing id is known.
 * Returns null when Open car should be hidden.
 */
export function tradeOpenCarHref(listingId: number | null | undefined): string | null {
  if (listingId == null || !Number.isFinite(listingId) || listingId <= 0) return null;
  return `/cars/${listingId}`;
}

export function tradeOpenCarLabel(): string {
  return "Open car";
}
