/**
 * Favourites grid sort — same keys, order, and price-facing labels as My cars.
 */
import {
  DEFAULT_GARAGE_SORT,
  GARAGE_SORT_OPTIONS,
  parseGarageSort,
  sortGarageCars,
  type GarageSort,
  type GarageSortableCar,
} from "./garage-sort";

export type FavouritesSort = GarageSort;

export const DEFAULT_FAVOURITES_SORT: FavouritesSort = DEFAULT_GARAGE_SORT;

export const FAVOURITES_SORT_OPTIONS = GARAGE_SORT_OPTIONS;

export const parseFavouritesSort = parseGarageSort;
export const sortFavouriteCars = sortGarageCars;

export type FavouritesSortableCar = GarageSortableCar;
