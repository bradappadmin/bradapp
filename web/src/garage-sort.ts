/** Client-side sort for My cars Owned / For sale grids. */

export type GarageSort =
  | "value_desc"
  | "value_asc"
  | "name_asc"
  | "name_desc";

export const GARAGE_SORT_OPTIONS: Array<{ value: GarageSort; label: string }> = [
  { value: "value_desc", label: "Highest value" },
  { value: "value_asc", label: "Lowest value" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

export const DEFAULT_GARAGE_SORT: GarageSort = "value_desc";

export type GarageSortableCar = {
  make: string;
  model: string;
  trimName?: string;
  coinPrice: number;
};

export function parseGarageSort(raw: string | null | undefined): GarageSort {
  switch (raw) {
    case "value_desc":
    case "value_asc":
    case "name_asc":
    case "name_desc":
      return raw;
    default:
      return DEFAULT_GARAGE_SORT;
  }
}

export function garageCarName(car: GarageSortableCar): string {
  return [car.make, car.model, car.trimName].filter(Boolean).join(" ").trim().toLocaleLowerCase();
}

export function sortGarageCars<T extends GarageSortableCar>(
  cars: T[],
  sort: GarageSort,
): T[] {
  const next = [...cars];
  switch (sort) {
    case "value_desc":
      next.sort((a, b) => Number(b.coinPrice) - Number(a.coinPrice) || garageCarName(a).localeCompare(garageCarName(b)));
      return next;
    case "value_asc":
      next.sort((a, b) => Number(a.coinPrice) - Number(b.coinPrice) || garageCarName(a).localeCompare(garageCarName(b)));
      return next;
    case "name_asc":
      next.sort((a, b) => garageCarName(a).localeCompare(garageCarName(b)) || Number(b.coinPrice) - Number(a.coinPrice));
      return next;
    case "name_desc":
      next.sort((a, b) => garageCarName(b).localeCompare(garageCarName(a)) || Number(b.coinPrice) - Number(a.coinPrice));
      return next;
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}
