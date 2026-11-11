/**
 * Catalogue sort for `/cars` — wired through the search API `sort` param.
 * Labels match My cars / Favourites Sort the bay (shared garage options).
 */
import { GARAGE_SORT_OPTIONS, type GarageSort } from "./garage-sort";

export type CarsSort = "price_desc" | "price_asc" | "name_asc" | "name_desc";

const GARAGE_TO_CARS_SORT: Record<GarageSort, CarsSort> = {
  value_desc: "price_desc",
  value_asc: "price_asc",
  name_asc: "name_asc",
  name_desc: "name_desc",
};

/** Same bay labels/order as Favourites and My cars; values are catalogue API keys. */
export const CARS_SORT_OPTIONS: Array<{ value: CarsSort; label: string }> =
  GARAGE_SORT_OPTIONS.map((option) => ({
    value: GARAGE_TO_CARS_SORT[option.value],
    label: option.label,
  }));

/** Lowest price first — catalogue shopping default (omitted from the URL). */
export const DEFAULT_CARS_SORT: CarsSort = "price_asc";

export function parseCarsSort(raw: string | null | undefined): CarsSort {
  switch (raw) {
    case "price_asc":
    case "price_desc":
    case "name_asc":
    case "name_desc":
      return raw;
    default:
      return DEFAULT_CARS_SORT;
  }
}
