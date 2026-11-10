/**
 * Favourites grid sort — same keys/order as My cars garage sort,
 * with price-facing labels for catalogue BC amounts.
 */
import {
  DEFAULT_GARAGE_SORT,
  parseGarageSort,
  sortGarageCars,
  type GarageSort,
  type GarageSortableCar,
} from "./garage-sort";

export type FavouritesSort = GarageSort;

export const DEFAULT_FAVOURITES_SORT: FavouritesSort = DEFAULT_GARAGE_SORT;

export const FAVOURITES_SORT_OPTIONS: Array<{ value: FavouritesSort; label: string }> = [
  { value: "value_desc", label: "Highest price" },
  { value: "value_asc", label: "Lowest price" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

export const parseFavouritesSort = parseGarageSort;
export const sortFavouriteCars = sortGarageCars;

export type FavouritesSortableCar = GarageSortableCar;
