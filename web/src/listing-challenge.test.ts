import { describe, expect, it } from "vitest";
import { listingChallengeAction, listingChallengeHref } from "./listing-challenge";

describe("listingChallengeHref", () => {
  it("builds a play deep-link with opponent and their car", () => {
    expect(listingChallengeHref(177, 143)).toBe("/play?opponent=177&theirCar=143");
  });
});

describe("listingChallengeAction", () => {
  it("hides for dealership stock and own listings", () => {
    expect(listingChallengeAction({ ownerUserId: null, viewerId: 2 })).toBe("hidden");
    expect(listingChallengeAction({ ownerUserId: 2, viewerId: 2 })).toBe("hidden");
  });

  it("prompts sign-in when a member owns the car and the viewer is signed out", () => {
    expect(listingChallengeAction({ ownerUserId: 177, viewerId: null })).toBe("signin");
    expect(listingChallengeAction({ ownerUserId: 177, viewerId: undefined })).toBe("signin");
  });

  it("offers challenge for another member's listing", () => {
    expect(listingChallengeAction({ ownerUserId: 177, viewerId: 2 })).toBe("challenge");
  });
});
