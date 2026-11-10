import { describe, expect, it } from "vitest";
import type { CompletedTrade } from "./api";
import { tradeAgainAction, tradeAgainHref } from "./trade-history-again";

const base: CompletedTrade = {
  id: 5,
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

describe("trade history Trade again deep-links", () => {
  it("links compose with counterparty and their car when still owned", () => {
    expect(tradeAgainAction(base)).toBe("offer");
    expect(tradeAgainHref(base)).toBe("/trades?with=177&theirCar=42");
  });

  it("disables when the counterparty no longer owns that car", () => {
    const gone: CompletedTrade = { ...base, theirCarAvailable: false };
    expect(tradeAgainAction(gone)).toBe("disabled");
    expect(tradeAgainHref(gone)).toBeNull();
  });

  it("hides when counterparty id is missing", () => {
    const missing: CompletedTrade = { ...base, counterpartyUserId: 0 };
    expect(tradeAgainAction(missing)).toBe("hidden");
    expect(tradeAgainHref(missing)).toBeNull();
  });
});
