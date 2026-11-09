import { describe, expect, it } from "vitest";
import { garageTradeOfferAction, garageTradeOfferHref } from "./garage-trade-offer";

describe("garageTradeOfferHref", () => {
  it("builds a trades deep-link with member and their car", () => {
    expect(garageTradeOfferHref(177, 143)).toBe("/trades?with=177&theirCar=143");
  });
});

describe("garageTradeOfferAction", () => {
  it("hides for dealership stock and own cars", () => {
    expect(garageTradeOfferAction({ ownerUserId: null, viewerId: 2 })).toBe("hidden");
    expect(garageTradeOfferAction({ ownerUserId: 2, viewerId: 2 })).toBe("hidden");
  });

  it("prompts sign-in when a member owns the car and the viewer is signed out", () => {
    expect(garageTradeOfferAction({ ownerUserId: 177, viewerId: null })).toBe("signin");
  });

  it("offers trade for another member’s car", () => {
    expect(garageTradeOfferAction({ ownerUserId: 177, viewerId: 2 })).toBe("offer");
  });
});
