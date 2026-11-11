import type { FavouriteCar } from "./api";

export function matchesFavouritesCarQuery(car: FavouriteCar, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [car.make, car.model, car.trimName].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(needle);
}

export function filterFavouritesByCarQuery(
  cars: FavouriteCar[],
  q: string,
): FavouriteCar[] {
  return cars.filter((car) => matchesFavouritesCarQuery(car, q));
}
