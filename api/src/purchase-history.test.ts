import { describe, expect, it } from "vitest";
import type { PurchasedCar } from "./purchase-history.js";

function isPurchasedCarShape(row: PurchasedCar): boolean {
  return (
    typeof row.ledgerId === "number" &&
    typeof row.listingId === "number" &&
    typeof row.make === "string" &&
    typeof row.model === "string" &&
    typeof row.paidPrice === "number" &&
    typeof row.purchasedAt === "string" &&
    (row.sellerDisplayName === null || typeof row.sellerDisplayName === "string")
  );
}

describe("purchase history shape", () => {
  it("accepts a purchase with a known member seller", () => {
    const row: PurchasedCar = {
      ledgerId: 1,
      listingId: 9,
      make: "Porsche",
      model: "911",
      trimName: "GT3",
      bodyType: "Coupe",
      colour: "Racing Red",
      year: 2022,
      paidPrice: 50,
      purchasedAt: "2026-11-09T12:00:00.000Z",
      sellerDisplayName: "Coin Buyer",
    };
    expect(isPurchasedCarShape(row)).toBe(true);
  });

  it("allows a null seller for catalogue / bay stock buys", () => {
    const row: PurchasedCar = {
      ledgerId: 2,
      listingId: 10,
      make: "Ford",
      model: "Focus",
      trimName: "ST",
      bodyType: "Hatchback",
      colour: "Blue",
      year: 2020,
      paidPrice: 80,
      purchasedAt: "2026-11-09T12:01:00.000Z",
      sellerDisplayName: null,
    };
    expect(isPurchasedCarShape(row)).toBe(true);
  });
});
