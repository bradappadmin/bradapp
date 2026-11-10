/**
 * Whether Open member should show for a Compare hero side.
 * Needs a real member owner who is not the viewer. Hidden for missing /
 * house (no member id) / self.
 */
export function canOpenCompareMember(
  ownerUserId: number | null | undefined,
  viewerUserId: number | null | undefined,
): boolean {
  if (ownerUserId == null || !Number.isFinite(ownerUserId) || ownerUserId <= 0) return false;
  if (viewerUserId != null && ownerUserId === viewerUserId) return false;
  return true;
}

/**
 * Public garage deep-link for a Compare hero’s member owner (`/members/:id`).
 * Returns null when Open member should be hidden.
 */
export function compareOpenMemberHref(
  ownerUserId: number | null | undefined,
  viewerUserId?: number | null,
): string | null {
  if (!canOpenCompareMember(ownerUserId, viewerUserId ?? null)) return null;
  return `/members/${ownerUserId}`;
}

export function compareOpenMemberLabel(): string {
  return "Open member";
}
