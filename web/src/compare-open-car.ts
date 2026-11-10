/**
 * Whether Open car should show for a Compare hero side.
 * Needs a real catalogue listing id.
 */
export function canOpenCompareCar(listingId: number | null | undefined): boolean {
  return listingId != null && Number.isFinite(listingId) && listingId > 0;
}

/**
 * Catalogue listing deep-link for a Compare hero (`/cars/:id`).
 * Returns null when Open car should be hidden.
 */
export function compareOpenCarHref(listingId: number | null | undefined): string | null {
  if (!canOpenCompareCar(listingId)) return null;
  return `/cars/${listingId}`;
}

export function compareOpenCarLabel(): string {
  return "Open car";
}

export function compareOpenCarAriaLabel(title: string): string {
  return `Open car ${title}`;
}
