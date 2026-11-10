import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVIEWS_SORT,
  parseReviewsSort,
  REVIEWS_SORT_OPTIONS,
  sortReviews,
} from "./reviews-sort";

const reviews = [
  { id: 1, title: "Zebra bay", createdAt: "2026-11-09T12:00:00.000Z" },
  { id: 2, title: "Alpha drag", createdAt: "2026-11-08T12:00:00.000Z" },
  { id: 3, title: "Mid cue", createdAt: "2026-11-10T12:00:00.000Z" },
];

describe("reviews sort", () => {
  it("parses known sort keys and falls back to newest", () => {
    expect(parseReviewsSort("oldest")).toBe("oldest");
    expect(parseReviewsSort("title_asc")).toBe("title_asc");
    expect(parseReviewsSort(null)).toBe(DEFAULT_REVIEWS_SORT);
    expect(parseReviewsSort("nope")).toBe("newest");
  });

  it("exposes bay labels", () => {
    expect(REVIEWS_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Newest",
      "Oldest",
      "Title A–Z",
      "Title Z–A",
    ]);
  });

  it("sorts by newest and oldest createdAt", () => {
    expect(sortReviews(reviews, "newest").map((r) => r.id)).toEqual([3, 1, 2]);
    expect(sortReviews(reviews, "oldest").map((r) => r.id)).toEqual([2, 1, 3]);
  });

  it("sorts by title A–Z and Z–A", () => {
    expect(sortReviews(reviews, "title_asc").map((r) => r.title)).toEqual([
      "Alpha drag",
      "Mid cue",
      "Zebra bay",
    ]);
    expect(sortReviews(reviews, "title_desc").map((r) => r.title)).toEqual([
      "Zebra bay",
      "Mid cue",
      "Alpha drag",
    ]);
  });
});
