/**
 * Catalogue deep-link for a family activity row when a listing id is known.
 * Returns null when Open car should be hidden.
 */
export function activityOpenCarHref(listingId: number | null | undefined): string | null {
  if (listingId == null || !Number.isFinite(listingId) || listingId <= 0) return null;
  return `/cars/${listingId}`;
}

export function activityOpenCarLabel(): string {
  return "Open car";
}
