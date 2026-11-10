import type { ReviewSummary, ReviewType } from "./api";

export type ReviewsTypeFilter = "all" | ReviewType;

export const REVIEWS_TYPE_FILTERS: Array<{ id: ReviewsTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "review", label: "Cue card" },
  { id: "drag_race", label: "Drag race" },
];

export function parseReviewsTypeFilter(raw: string | null): ReviewsTypeFilter {
  switch (raw) {
    case "review":
    case "drag_race":
      return raw;
    default:
      return "all";
  }
}

function carHaystack(car: ReviewSummary["car"] | null | undefined): string {
  if (!car) return "";
  return [car.make, car.model, car.trimName].filter(Boolean).join(" ");
}

export function matchesReviewsCarQuery(review: ReviewSummary, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [review.title, carHaystack(review.car), carHaystack(review.carB)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterReviewsByCarQuery(
  reviews: ReviewSummary[],
  q: string,
): ReviewSummary[] {
  return reviews.filter((review) => matchesReviewsCarQuery(review, q));
}
