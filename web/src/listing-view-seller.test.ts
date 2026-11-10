import { describe, expect, it } from "vitest";
import {
  canViewSeller,
  listingViewSellerHref,
  listingViewSellerLabel,
} from "./listing-view-seller";

describe("listing View seller", () => {
  it("links the member seller garage", () => {
    expect(canViewSeller(177, 2)).toBe(true);
    expect(listingViewSellerHref(177)).toBe("/members/177");
    expect(listingViewSellerLabel()).toBe("View seller");
  });

  it("hides for house / garage-only listings with no member id", () => {
    expect(canViewSeller(null, 2)).toBe(false);
    expect(canViewSeller(0, 2)).toBe(false);
    expect(canViewSeller(undefined, 2)).toBe(false);
  });

  it("hides when the viewer owns the listing", () => {
    expect(canViewSeller(2, 2)).toBe(false);
  });

  it("shows for signed-out viewers when a member seller exists", () => {
    expect(canViewSeller(177, null)).toBe(true);
  });
});
