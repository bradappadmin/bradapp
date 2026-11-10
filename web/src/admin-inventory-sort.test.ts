import { describe, expect, it } from "vitest";
import {
  ADMIN_INVENTORY_SORT_OPTIONS,
  DEFAULT_ADMIN_INVENTORY_SORT,
  parseAdminInventorySort,
  sortAdminInventoryListings,
} from "./admin-inventory-sort";
import { GARAGE_SORT_OPTIONS } from "./garage-sort";

describe("admin-inventory-sort", () => {
  it("reuses shared garage sort options and default", () => {
    expect(DEFAULT_ADMIN_INVENTORY_SORT).toBe("value_desc");
    expect(ADMIN_INVENTORY_SORT_OPTIONS).toEqual(GARAGE_SORT_OPTIONS);
    expect(ADMIN_INVENTORY_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Highest price",
      "Lowest price",
      "Name A–Z",
      "Name Z–A",
    ]);
    expect(parseAdminInventorySort(null)).toBe(DEFAULT_ADMIN_INVENTORY_SORT);
    expect(parseAdminInventorySort("name_asc")).toBe("name_asc");
    expect(parseAdminInventorySort("nope")).toBe("value_desc");
  });

  it("sorts listings by price and name", () => {
    const listings = [
      { id: 1, make: "Ford", model: "Focus", trimName: "ST", coinPrice: 80 },
      { id: 2, make: "Audi", model: "RS6", trimName: "Avant", coinPrice: 500 },
      { id: 3, make: "Porsche", model: "911", trimName: "GT3", coinPrice: 900 },
    ];
    expect(sortAdminInventoryListings(listings, "value_desc").map((l) => l.id)).toEqual([
      3, 2, 1,
    ]);
    expect(sortAdminInventoryListings(listings, "value_asc").map((l) => l.id)).toEqual([
      1, 2, 3,
    ]);
    expect(sortAdminInventoryListings(listings, "name_asc").map((l) => l.make)).toEqual([
      "Audi",
      "Ford",
      "Porsche",
    ]);
    expect(sortAdminInventoryListings(listings, "name_desc").map((l) => l.make)).toEqual([
      "Porsche",
      "Ford",
      "Audi",
    ]);
  });
});
