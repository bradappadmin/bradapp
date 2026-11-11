import { describe, expect, it } from "vitest";
import { matchHistoryOpenCarHref, matchHistoryOpenCarLabel } from "./match-history-open-car";

describe("match history Open car", () => {
  it("links the catalogue when listing id is known", () => {
    expect(matchHistoryOpenCarHref({ listingId: 42 })).toBe("/cars/42");
    expect(matchHistoryOpenCarLabel()).toBe("Open car");
  });

  it("hides when listing id is missing", () => {
    expect(matchHistoryOpenCarHref({ listingId: null })).toBeNull();
    expect(matchHistoryOpenCarHref({ listingId: 0 })).toBeNull();
  });
});
