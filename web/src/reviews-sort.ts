/** Client-side sort for the Video reviews reel. */

export type ReviewsSort = "newest" | "oldest" | "title_asc" | "title_desc";

export const REVIEWS_SORT_OPTIONS: Array<{ value: ReviewsSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

export const DEFAULT_REVIEWS_SORT: ReviewsSort = "newest";

export type ReviewsSortable = {
  title: string;
  createdAt: string;
};

export function parseReviewsSort(raw: string | null | undefined): ReviewsSort {
  switch (raw) {
    case "newest":
    case "oldest":
    case "title_asc":
    case "title_desc":
      return raw;
    default:
      return DEFAULT_REVIEWS_SORT;
  }
}

function titleKey(review: ReviewsSortable): string {
  return review.title.trim().toLocaleLowerCase();
}

function createdMs(review: ReviewsSortable): number {
  const ms = Date.parse(review.createdAt);
  return Number.isFinite(ms) ? ms : 0;
}

export function sortReviews<T extends ReviewsSortable>(
  reviews: T[],
  sort: ReviewsSort,
): T[] {
  const next = [...reviews];
  switch (sort) {
    case "newest":
      next.sort(
        (a, b) => createdMs(b) - createdMs(a) || titleKey(a).localeCompare(titleKey(b)),
      );
      return next;
    case "oldest":
      next.sort(
        (a, b) => createdMs(a) - createdMs(b) || titleKey(a).localeCompare(titleKey(b)),
      );
      return next;
    case "title_asc":
      next.sort(
        (a, b) => titleKey(a).localeCompare(titleKey(b)) || createdMs(b) - createdMs(a),
      );
      return next;
    case "title_desc":
      next.sort(
        (a, b) => titleKey(b).localeCompare(titleKey(a)) || createdMs(b) - createdMs(a),
      );
      return next;
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}
