import type { CompletedTrade } from "./api";

export type TradeAgainAction = "offer" | "disabled" | "hidden";

/**
 * Deep-link into `/trades` compose for the same counterparty.
 * Includes `theirCar` when they still own the car from this swap.
 */
export function tradeAgainHref(trade: CompletedTrade): string | null {
  const partnerId = trade.counterpartyUserId;
  if (!Number.isFinite(partnerId) || partnerId <= 0) return null;
  if (!trade.theirCarAvailable) return null;

  const theirCarId = trade.theirCarListingId;
  if (!Number.isFinite(theirCarId) || theirCarId <= 0) return null;

  const params = new URLSearchParams({
    with: String(partnerId),
    theirCar: String(theirCarId),
  });
  return `/trades?${params.toString()}`;
}

/**
 * Trade again CTA:
 * - offer — car still owned by counterparty
 * - disabled — counterparty known but that car is gone
 * - hidden — missing partner id
 */
export function tradeAgainAction(trade: CompletedTrade): TradeAgainAction {
  // Only accepted swaps transferred cars — Trade again is for those rows.
  if (trade.status !== "accepted") return "hidden";
  const partnerId = trade.counterpartyUserId;
  if (!Number.isFinite(partnerId) || partnerId <= 0) return "hidden";
  if (!trade.theirCarAvailable) return "disabled";
  const theirCarId = trade.theirCarListingId;
  if (!Number.isFinite(theirCarId) || theirCarId <= 0) return "disabled";
  return "offer";
}
