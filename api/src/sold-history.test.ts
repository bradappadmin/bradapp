import { describe, expect, it } from "vitest";
import type { SoldCar } from "./sold-history.js";

/** Shape guard for sold-history rows returned to My cars. */
function isSoldCarShape(row: SoldCar): boolean {
  return (
    typeof row.ledgerId === "number" &&
    typeof row.listingId === "number" &&
    typeof row.make === "string" &&
    typeof row.model === "string" &&
    typeof row.soldPrice === "number" &&
    typeof row.soldAt === "string" &&
    (row.buyerDisplayName === null || typeof row.buyerDisplayName === "string")
  );
}

describe("sold history shape", () => {
  it("accepts a typical sold row with a visible buyer", () => {
    const row: SoldCar = {
      ledgerId: 1,
      listingId: 9,
      make: "Porsche",
      model: "911",
      trimName: "GT3",
      bodyType: "Coupe",
      colour: "Racing Red",
      year: 2022,
      soldPrice: 50,
      soldAt: "2026-11-09T12:00:00.000Z",
      buyerDisplayName: "Second Buyer",
    };
    expect(isSoldCarShape(row)).toBe(true);
  });

  it("allows a null buyer when the purchase join cannot resolve", () => {
    const row: SoldCar = {
      ledgerId: 2,
      listingId: 10,
      make: "Ford",
      model: "Focus",
      trimName: "ST",
      bodyType: "Hatchback",
      colour: "Blue",
      year: 2020,
      soldPrice: 40,
      soldAt: "2026-11-09T12:01:00.000Z",
      buyerDisplayName: null,
    };
    expect(isSoldCarShape(row)).toBe(true);
  });
});
