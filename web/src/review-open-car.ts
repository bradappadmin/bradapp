import type { ReviewCar, ReviewSummary } from "./api";

export type ReviewCarWithListing = ReviewCar & { listingId: number };

/**
 * Related bay cars on a review that have a catalogue listing for Open car → /cars/:id.
 */
export function reviewRelatedListingCars(
  review: Pick<ReviewSummary, "car" | "carB">,
): ReviewCarWithListing[] {
  return [review.car, review.carB].filter(
    (c): c is ReviewCarWithListing =>
      c != null && c.listingId != null && Number.isFinite(c.listingId) && c.listingId > 0,
  );
}

export function reviewOpenCarHref(listingId: number): string {
  return `/cars/${listingId}`;
}

export function reviewOpenCarAriaLabel(car: Pick<ReviewCar, "make" | "model">): string {
  return `Open car ${car.make} ${car.model}`;
}
