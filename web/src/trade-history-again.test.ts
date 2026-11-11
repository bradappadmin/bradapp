import { describe, expect, it } from "vitest";
import type { CompletedTrade } from "./api";
import { canOfferAgain, offerAgainHref, offerAgainLabel } from "./trade-history-again";

const base: CompletedTrade = {
  id: 5,
  status: "accepted",
  resolvedAt: "2026-11-09T20:00:00.000Z",
  counterpartyName: "Sam Bay",
  counterpartyUserId: 177,
  theirCarListingId: 42,
  theirCarAvailable: true,
  youWere: "offerer",
  youGave: {
    listingId: 42,
    make: "Porsche",
    model: "911",
    trimName: "GT3",
  },
  youGot: {
    listingId: 9,
    make: "BMW",
    model: "M3",
    trimName: "Competition",
  },
};

describe("trade history Offer again deep-links", () => {
  it("links compose with counterparty and theirCar when still owned", () => {
    expect(canOfferAgain(base, 2)).toBe(true);
    expect(offerAgainHref(base, 2)).toBe("/trades?with=177&theirCar=42");
    expect(offerAgainLabel()).toBe("Offer again");
  });

  it("still offers /trades?with= when that car is no longer owned", () => {
    const gone: CompletedTrade = { ...base, theirCarAvailable: false };
    expect(canOfferAgain(gone, 2)).toBe(true);
    expect(offerAgainHref(gone, 2)).toBe("/trades?with=177");
  });

  it("offers again on declined rows with the same counterparty", () => {
    const declined: CompletedTrade = {
      ...base,
      status: "declined",
      theirCarAvailable: false,
    };
    expect(canOfferAgain(declined, 2)).toBe(true);
    expect(offerAgainHref(declined, 2)).toBe("/trades?with=177");
  });

  it("hides when counterparty id is missing", () => {
    const missing: CompletedTrade = { ...base, counterpartyUserId: 0 };
    expect(canOfferAgain(missing, 2)).toBe(false);
    expect(offerAgainHref(missing, 2)).toBeNull();
  });

  it("hides when the counterparty is the viewer", () => {
    const self: CompletedTrade = { ...base, counterpartyUserId: 2 };
    expect(canOfferAgain(self, 2)).toBe(false);
    expect(offerAgainHref(self, 2)).toBeNull();
    expect(canOfferAgain(self, 99)).toBe(true);
    expect(offerAgainHref(self, 99)).toBe("/trades?with=2&theirCar=42");
  });
});
