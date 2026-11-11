/** Deep-link into Top Trumps PvP with opponent (and optional car) pre-selected. */

export function listingChallengeHref(ownerUserId: number, listingId: number): string {
  const params = new URLSearchParams({
    opponent: String(ownerUserId),
    theirCar: String(listingId),
  });
  return `/play?${params.toString()}`;
}

export type ListingChallengeAction = "hidden" | "signin" | "challenge";

/**
 * Challenge CTA rules for a listing detail:
 * - dealership stock (no member owner) → hide
 * - own listing → hide
 * - signed out + member owner → prompt sign-in
 * - signed in + other member owner → challenge
 */
export function listingChallengeAction(input: {
  ownerUserId: number | null | undefined;
  viewerId: number | null | undefined;
}): ListingChallengeAction {
  const ownerId =
    input.ownerUserId != null && Number.isFinite(input.ownerUserId) && input.ownerUserId > 0
      ? Number(input.ownerUserId)
      : null;
  if (ownerId == null) return "hidden";
  if (input.viewerId == null) return "signin";
  if (input.viewerId === ownerId) return "hidden";
  return "challenge";
}
