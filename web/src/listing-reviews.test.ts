import { describe, expect, it } from "vitest";
import { listingReviewsHref, listingReviewsQuery } from "./listing-reviews";

describe("listingReviews", () => {
  it("builds a Find query from make and model", () => {
    expect(listingReviewsQuery("Bugatti", "Chiron")).toBe("Bugatti Chiron");
    expect(listingReviewsQuery("  Ford  ", " Focus ")).toBe("Ford Focus");
    expect(listingReviewsQuery("", "")).toBe("");
  });

  it("deep-links into /reviews with q for make/model", () => {
    expect(listingReviewsHref("Bugatti", "Chiron")).toBe("/reviews?q=Bugatti+Chiron");
    expect(listingReviewsHref("", "")).toBe("/reviews");
  });
});
