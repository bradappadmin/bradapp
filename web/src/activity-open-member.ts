/**
 * Whether Open member should show for a family activity row.
 * Needs a real actor member who is not the viewer. Hidden for missing / self
 * (and house if ever surfaced with no member id).
 */
export function canOpenActivityMember(
  actorUserId: number | null | undefined,
  viewerUserId: number | null | undefined,
): boolean {
  if (actorUserId == null || !Number.isFinite(actorUserId) || actorUserId <= 0) return false;
  if (viewerUserId != null && actorUserId === viewerUserId) return false;
  return true;
}

/**
 * Public garage deep-link for the activity actor (`/members/:id`).
 * Returns null when Open member should be hidden.
 */
export function activityOpenMemberHref(
  actorUserId: number | null | undefined,
  viewerUserId?: number | null,
): string | null {
  if (!canOpenActivityMember(actorUserId, viewerUserId ?? null)) return null;
  return `/members/${actorUserId}`;
}

export function activityOpenMemberLabel(): string {
  return "Open member";
}
