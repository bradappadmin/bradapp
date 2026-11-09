import { describe, expect, it } from "vitest";
import type { TradeRow } from "./api";
import { tradeOfferCar, tradeRequestCar } from "./trade-cars";

const sample: TradeRow = {
  id: 1,
  status: "pending",
  fromUserId: 2,
  toUserId: 3,
  offerListingId: 10,
  requestListingId: 11,
  fromDisplayName: "Alex",
  toDisplayName: "Sam",
  offerMake: "Audi",
  offerModel: "RS6",
  offerTrimName: "Avant",
  offerBodyType: "Estate",
  offerColour: "Racing Red",
  offerYear: 2019,
  requestMake: "Ford",
  requestModel: "Focus",
  requestTrimName: "ST",
  requestBodyType: "Hatchback",
  requestColour: "Laser Blue",
  requestYear: 2020,
  createdAt: "2026-11-09T12:00:00.000Z",
};

describe("trade-cars", () => {
  it("maps offer and request sides for TrumpCard photos", () => {
    expect(tradeOfferCar(sample)).toMatchObject({
      make: "Audi",
      colour: "Racing Red",
      bodyType: "Estate",
    });
    expect(tradeRequestCar(sample)).toMatchObject({
      make: "Ford",
      colour: "Laser Blue",
      bodyType: "Hatchback",
    });
  });
});
