import type { ReviewCar } from "./api";
import { toComparePick, type ComparePick } from "./compare-selection";

/**
 * Shared compare-tray pick for a review car when a catalogue listing id is known.
 * Returns null when Compare should be hidden.
 */
export function reviewCarComparePick(
  car: Pick<
    ReviewCar,
    "make" | "model" | "trimName" | "listingId" | "listingYear" | "listingCoinPrice"
  >,
): ComparePick | null {
  const id = car.listingId;
  if (id == null || !Number.isFinite(id) || id <= 0) return null;
  return toComparePick({
    id,
    make: car.make,
    model: car.model,
    trimName: car.trimName,
    year: car.listingYear != null && Number.isFinite(car.listingYear) ? car.listingYear : 0,
    coinPrice:
      car.listingCoinPrice != null && Number.isFinite(car.listingCoinPrice)
        ? car.listingCoinPrice
        : 0,
  });
}

export function reviewCompareLabel(selected: boolean): string {
  return selected ? "In compare" : "Compare";
}
