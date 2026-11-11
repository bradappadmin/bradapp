/**
 * Admin inventory listings sort — same keys, order, and price-facing labels as My cars / Favourites / Cars.
 */
import {
  DEFAULT_GARAGE_SORT,
  GARAGE_SORT_OPTIONS,
  parseGarageSort,
  sortGarageCars,
  type GarageSort,
  type GarageSortableCar,
} from "./garage-sort";

export type AdminInventorySort = GarageSort;

export const DEFAULT_ADMIN_INVENTORY_SORT: AdminInventorySort = DEFAULT_GARAGE_SORT;

export const ADMIN_INVENTORY_SORT_OPTIONS = GARAGE_SORT_OPTIONS;

export const parseAdminInventorySort = parseGarageSort;

export const sortAdminInventoryListings = sortGarageCars;

export type AdminInventorySortableListing = GarageSortableCar;
