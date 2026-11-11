import type { GarageCar } from "./api";

export function matchesGarageCarQuery(car: GarageCar, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [car.make, car.model, car.trimName].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(needle);
}

export function filterGarageCarsByQuery(cars: GarageCar[], q: string): GarageCar[] {
  return cars.filter((car) => matchesGarageCarQuery(car, q));
}
