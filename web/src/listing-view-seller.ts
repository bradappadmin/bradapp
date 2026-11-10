/**
 * Whether a listing can show View seller → /members/:id.
 * Needs a real member owner who is not the viewer.
 */
export function canViewSeller(
  ownerUserId: number | null | undefined,
  viewerUserId: number | null | undefined,
): boolean {
  if (ownerUserId == null || !Number.isFinite(ownerUserId) || ownerUserId <= 0) return false;
  if (viewerUserId != null && ownerUserId === viewerUserId) return false;
  return true;
}

/** Public garage deep-link for the listing’s member seller. */
export function listingViewSellerHref(ownerUserId: number): string {
  return `/members/${ownerUserId}`;
}

export function listingViewSellerLabel(): string {
  return "View seller";
}
