import { describe, expect, it } from "vitest";
import type { ReviewSummary } from "./api";
import {
  filterReviewsByCarQuery,
  parseReviewsTypeFilter,
  REVIEWS_TYPE_FILTERS,
} from "./reviews-car-filter";

function review(
  partial: Partial<ReviewSummary> &
    Pick<ReviewSummary, "id" | "title" | "type"> & {
      car: ReviewSummary["car"];
      carB?: ReviewSummary["carB"];
    },
): ReviewSummary {
  return {
    status: "published",
    createdAt: "2026-11-10T00:00:00.000Z",
    publisher: { id: 1, displayName: "Brad" },
    carB: null,
    cueCards: [],
    videoUrl: "/reviews/1/video",
    mimeType: "video/webm",
    likeCount: 0,
    likedByMe: false,
    featured: false,
    ...partial,
  };
}

const porsche = {
  id: 10,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  bodyType: "Coupe",
  colour: "Midnight Black",
  bhp: 502,
  topSpeedMph: 197,
  zeroToSixtySecs: 3.2,
};

const mustang = {
  id: 11,
  make: "Ford",
  model: "Mustang",
  trimName: "GT",
  bodyType: "Coupe",
  colour: "Race Red",
  bhp: 450,
  topSpeedMph: 155,
  zeroToSixtySecs: 4.2,
};

const rows: ReviewSummary[] = [
  review({
    id: 1,
    type: "review",
    title: "Bay cue card",
    car: porsche,
  }),
  review({
    id: 2,
    type: "drag_race",
    title: "Straight-line scrap",
    car: porsche,
    carB: mustang,
  }),
];

describe("reviews-car-filter", () => {
  it("parses type chips", () => {
    expect(parseReviewsTypeFilter(null)).toBe("all");
    expect(parseReviewsTypeFilter("review")).toBe("review");
    expect(parseReviewsTypeFilter("drag_race")).toBe("drag_race");
    expect(parseReviewsTypeFilter("nope")).toBe("all");
    expect(REVIEWS_TYPE_FILTERS.map((f) => f.label)).toEqual([
      "All",
      "Cue card",
      "Drag race",
    ]);
  });

  it("filters by title, make, and model including drag lane B", () => {
    expect(filterReviewsByCarQuery(rows, "cue").map((r) => r.id)).toEqual([1]);
    expect(filterReviewsByCarQuery(rows, "porsche").map((r) => r.id)).toEqual([1, 2]);
    expect(filterReviewsByCarQuery(rows, "mustang").map((r) => r.id)).toEqual([2]);
    expect(filterReviewsByCarQuery(rows, "gt3").map((r) => r.id)).toEqual([1, 2]);
    expect(filterReviewsByCarQuery(rows, "zzzz")).toEqual([]);
  });
});
