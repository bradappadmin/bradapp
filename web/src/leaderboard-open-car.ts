/**
 * Whether Open car should show for a leaderboard highlight garage car.
 * Needs a real catalogue listing id.
 */
export function canOpenLeaderboardCar(
  listingId: number | null | undefined,
): boolean {
  return listingId != null && Number.isFinite(listingId) && listingId > 0;
}

/**
 * Catalogue listing deep-link for a leaderboard highlight car (`/cars/:id`).
 * Returns null when Open car should be hidden.
 */
export function leaderboardOpenCarHref(
  listingId: number | null | undefined,
): string | null {
  if (!canOpenLeaderboardCar(listingId)) return null;
  return `/cars/${listingId}`;
}

export function leaderboardOpenCarLabel(): string {
  return "Open car";
}

export function leaderboardOpenCarAriaLabel(title: string): string {
  return `Open car ${title}`;
}
