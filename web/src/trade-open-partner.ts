function validPartnerId(id: number | null | undefined): id is number {
  return id != null && Number.isFinite(id) && id > 0;
}

/**
 * Whether Open partner should show for this other party.
 * Needs a real partner who is not the viewer.
 */
export function canOpenPartner(
  partnerUserId: number | null | undefined,
  viewerUserId: number | null | undefined,
): boolean {
  if (!validPartnerId(partnerUserId)) return false;
  if (viewerUserId != null && partnerUserId === viewerUserId) return false;
  return true;
}

/**
 * Public garage deep-link for the other party (`/members/:id`).
 * Returns null when Open partner should be hidden (missing partner or self).
 */
export function openPartnerHref(
  partnerUserId: number | null | undefined,
  viewerUserId?: number | null,
): string | null {
  if (!canOpenPartner(partnerUserId, viewerUserId ?? null)) return null;
  return `/members/${partnerUserId}`;
}

export function openPartnerLabel(): string {
  return "Open partner";
}
