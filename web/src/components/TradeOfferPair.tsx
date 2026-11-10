import type { TrumpCardData } from "./TrumpCard";
import { TrumpCard } from "./TrumpCard";

type TradeOfferPairProps = {
  offerCar: TrumpCardData;
  requestCar: TrumpCardData;
  /** Who is giving the offer car. */
  offerLabel: string;
  /** Who owns / receives the request car. */
  requestLabel: string;
  className?: string;
};

/** Side-by-side studio photos for a free card trade (offer ↔ request). */
export function TradeOfferPair({
  offerCar,
  requestCar,
  offerLabel,
  requestLabel,
  className = "",
}: TradeOfferPairProps) {
  return (
    <div className={`grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center ${className}`}>
      <TrumpCard label={offerLabel} car={offerCar} motion="bay" />
      <p
        className="hidden text-center font-display text-sm font-semibold text-steel sm:block"
        aria-hidden
      >
        ↔
      </p>
      <TrumpCard label={requestLabel} car={requestCar} motion="bay" />
    </div>
  );
}
