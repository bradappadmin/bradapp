import type { CompletedTrade } from "./api";

function validPartnerId(id: number | null | undefined): id is number {
  return id != null && Number.isFinite(id) && id > 0;
}

/**
 * Whether a history row can offer Offer again.
 * Needs a real counterparty who is not the viewer.
 */
export function canOfferAgain(
  trade: CompletedTrade,
  viewerUserId: number | null | undefined,
): boolean {
  if (!validPartnerId(trade.counterpartyUserId)) return false;
  if (viewerUserId != null && trade.counterpartyUserId === viewerUserId) return false;
  return true;
}

/**
 * Deep-link into `/trades` compose for the other party (`/trades?with=`).
 * Adds `theirCar` when they still own the car from this swap.
 * Returns null when Offer again should be hidden (missing partner or self).
 */
export function offerAgainHref(
  trade: CompletedTrade,
  viewerUserId?: number | null,
): string | null {
  if (!canOfferAgain(trade, viewerUserId ?? null)) return null;
  if (!validPartnerId(trade.counterpartyUserId)) return null;

  const params = new URLSearchParams({ with: String(trade.counterpartyUserId) });
  const theirCarId = trade.theirCarListingId;
  if (
    trade.theirCarAvailable &&
    theirCarId != null &&
    Number.isFinite(theirCarId) &&
    theirCarId > 0
  ) {
    params.set("theirCar", String(theirCarId));
  }
  return `/trades?${params.toString()}`;
}

export function offerAgainLabel(): string {
  return "Offer again";
}
