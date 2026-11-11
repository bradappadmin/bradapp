import { describe, expect, it } from "vitest";
import type { AdminListing } from "./api";
import {
  ADMIN_INVENTORY_GROUP_OPTIONS,
  filterAdminInventory,
  parseAdminInventoryGroup,
} from "./admin-inventory-filter";

function listing(
  partial: Partial<AdminListing> &
    Pick<AdminListing, "id" | "make" | "model" | "status">,
): AdminListing {
  return {
    conditionType: "used",
    year: 2022,
    colour: "Midnight Black",
    mileage: 1000,
    coinPrice: 100,
    ownerLabel: "Bay",
    garageId: 1,
    trimName: "",
    garageName: "Bay One",
    ...partial,
  };
}

const rows: AdminListing[] = [
  listing({ id: 1, make: "Audi", model: "RS6", trimName: "Avant", status: "available" }),
  listing({ id: 2, make: "Ford", model: "Focus", status: "owned" }),
  listing({ id: 3, make: "Porsche", model: "911", trimName: "GT3", status: "sold" }),
  listing({ id: 4, make: "Audi", model: "A3", status: "owned" }),
];

describe("admin-inventory-filter", () => {
  it("parses status chips and exposes labels", () => {
    expect(parseAdminInventoryGroup(null)).toBe("all");
    expect(parseAdminInventoryGroup("for_sale")).toBe("for_sale");
    expect(parseAdminInventoryGroup("sold_owned")).toBe("sold_owned");
    expect(parseAdminInventoryGroup("nope")).toBe("all");
    expect(ADMIN_INVENTORY_GROUP_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "For sale",
      "Sold/owned",
    ]);
  });

  it("filters by make, model, or trim", () => {
    expect(filterAdminInventory(rows, "audi", "all").map((l) => l.id)).toEqual([1, 4]);
    expect(filterAdminInventory(rows, "gt3", "all").map((l) => l.id)).toEqual([3]);
    expect(filterAdminInventory(rows, "focus", "all").map((l) => l.id)).toEqual([2]);
  });

  it("filters by for sale vs sold/owned", () => {
    expect(filterAdminInventory(rows, "", "for_sale").map((l) => l.id)).toEqual([1]);
    expect(filterAdminInventory(rows, "", "sold_owned").map((l) => l.id)).toEqual([2, 3, 4]);
  });

  it("combines search and status", () => {
    expect(filterAdminInventory(rows, "audi", "sold_owned").map((l) => l.id)).toEqual([4]);
    expect(filterAdminInventory(rows, "porsche", "for_sale")).toEqual([]);
  });
});
