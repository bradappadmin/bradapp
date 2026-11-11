import type { AdminListing } from "./api";

export type AdminInventoryGroup = "all" | "for_sale" | "sold_owned";

export const ADMIN_INVENTORY_GROUP_OPTIONS: Array<{
  id: AdminInventoryGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "for_sale", label: "For sale" },
  { id: "sold_owned", label: "Sold/owned" },
];

export function parseAdminInventoryGroup(raw: string | null): AdminInventoryGroup {
  switch (raw) {
    case "for_sale":
    case "sold_owned":
      return raw;
    default:
      return "all";
  }
}

export function matchesAdminInventoryQuery(listing: AdminListing, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [listing.make, listing.model, listing.trimName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function matchesAdminInventoryGroup(
  listing: AdminListing,
  group: AdminInventoryGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "for_sale":
      return listing.status === "available";
    case "sold_owned":
      return listing.status === "sold" || listing.status === "owned";
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterAdminInventory(
  listings: AdminListing[],
  q: string,
  group: AdminInventoryGroup,
): AdminListing[] {
  return listings.filter(
    (listing) =>
      matchesAdminInventoryQuery(listing, q) && matchesAdminInventoryGroup(listing, group),
  );
}
