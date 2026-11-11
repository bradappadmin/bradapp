/** Deep-link into free trade compose with member (and optional car) pre-selected. */

export function garageTradeOfferHref(memberUserId: number, listingId: number): string {
  const params = new URLSearchParams({
    with: String(memberUserId),
    theirCar: String(listingId),
  });
  return `/trades?${params.toString()}`;
}

export type GarageTradeOfferAction = "hidden" | "signin" | "offer";

/**
 * Offer-trade CTA rules (mirrors listing challenge):
 * - no member owner → hide
 * - own car → hide
 * - signed out + member owner → prompt sign-in
 * - signed in + other member → offer
 */
export function garageTradeOfferAction(input: {
  ownerUserId: number | null | undefined;
  viewerId: number | null | undefined;
}): GarageTradeOfferAction {
  const ownerId =
    input.ownerUserId != null && Number.isFinite(input.ownerUserId) && input.ownerUserId > 0
      ? Number(input.ownerUserId)
      : null;
  if (ownerId == null) return "hidden";
  if (input.viewerId == null) return "signin";
  if (input.viewerId === ownerId) return "hidden";
  return "offer";
}
