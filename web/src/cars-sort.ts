/** Catalogue sort for `/cars` — wired through the search API `sort` param. */

export type CarsSort = "price_asc" | "price_desc" | "year_desc";

export const DEFAULT_CARS_SORT: CarsSort = "price_asc";

export const CARS_SORT_OPTIONS: Array<{ value: CarsSort; label: string }> = [
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "year_desc", label: "Newest" },
];

export function parseCarsSort(raw: string | null | undefined): CarsSort {
  switch (raw) {
    case "price_asc":
    case "price_desc":
    case "year_desc":
      return raw;
    default:
      return DEFAULT_CARS_SORT;
  }
}
