import { DEFAULT_CARS_SORT } from "./cars-sort";

export type ListingSummary = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  fuel: string;
  drivetrain: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  ownerLabel: string;
  ownerUserId: number | null;
  status: "available" | "owned" | "sold";
  garageName: string;
  garageCity: string;
};

export type ListingDetail = ListingSummary & {
  doors: number;
  seats: number;
  garageTagline: string;
};

export type CarFilters = {
  makes: string[];
  models: string[];
  bodyTypes: string[];
  fuels: string[];
  colours: string[];
  /** Made-up dealerships with stock currently for sale. */
  garages: Array<{ name: string; city: string }>;
  conditions: Array<"new" | "used">;
  yearMin: number;
  yearMax: number;
  coinPriceMin: number;
  coinPriceMax: number;
};

export type SearchQuery = {
  q?: string;
  make?: string;
  model?: string;
  bodyType?: string;
  fuel?: string;
  colour?: string;
  /** Exact garage / dealership name. */
  garage?: string;
  condition?: "new" | "used" | "";
  yearMin?: string;
  yearMax?: string;
  coinMin?: string;
  coinMax?: string;
  mileageMax?: string;
  bhpMin?: string;
  /** Catalogue sort — see `cars-sort` (`price_asc` default). */
  sort?: string;
};

export { CARS_SORT_OPTIONS as SORT_OPTIONS, DEFAULT_CARS_SORT } from "./cars-sort";
export type { CarsSort } from "./cars-sort";

export type ActiveFilterChip = {
  key: keyof SearchQuery;
  label: string;
};

const FILTER_KEYS: Array<keyof SearchQuery> = [
  "q",
  "make",
  "model",
  "bodyType",
  "fuel",
  "colour",
  "garage",
  "condition",
  "yearMin",
  "yearMax",
  "coinMin",
  "coinMax",
  "mileageMax",
  "bhpMin",
];

export function formatCoins(n: number): string {
  return `${n.toLocaleString()} BC`;
}

export function formatMileage(n: number): string {
  return `${n.toLocaleString()} mi`;
}

export function listingTitle(listing: Pick<ListingSummary, "make" | "model" | "trimName">): string {
  return `${listing.make} ${listing.model}${listing.trimName ? ` ${listing.trimName}` : ""}`;
}

export function hasActiveFilters(query: SearchQuery): boolean {
  return FILTER_KEYS.some((key) => {
    const value = query[key];
    return value != null && String(value).trim() !== "";
  });
}

/** Human-readable chips for the filters currently applied (excludes default sort). */
export function activeFilterChips(query: SearchQuery): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (query.q?.trim()) chips.push({ key: "q", label: `“${query.q.trim()}”` });
  if (query.make) chips.push({ key: "make", label: query.make });
  if (query.model) chips.push({ key: "model", label: query.model });
  if (query.bodyType) chips.push({ key: "bodyType", label: query.bodyType });
  if (query.fuel) chips.push({ key: "fuel", label: query.fuel });
  if (query.garage) chips.push({ key: "garage", label: query.garage });
  if (query.condition === "new" || query.condition === "used") {
    chips.push({
      key: "condition",
      label: query.condition === "new" ? "New" : "Used",
    });
  }
  if (query.yearMin || query.yearMax) {
    const lo = query.yearMin || "…";
    const hi = query.yearMax || "…";
    chips.push({ key: "yearMin", label: `Year ${lo}–${hi}` });
  }
  if (query.coinMin || query.coinMax) {
    const lo = query.coinMin ? `${Number(query.coinMin).toLocaleString()} BC` : "…";
    const hi = query.coinMax ? `${Number(query.coinMax).toLocaleString()} BC` : "…";
    chips.push({ key: "coinMin", label: `Price ${lo}–${hi}` });
  }
  if (query.colour) chips.push({ key: "colour", label: query.colour });
  if (query.mileageMax) {
    chips.push({
      key: "mileageMax",
      label: `≤ ${Number(query.mileageMax).toLocaleString()} mi`,
    });
  }
  if (query.bhpMin) chips.push({ key: "bhpMin", label: `≥ ${query.bhpMin} bhp` });
  return chips;
}

/** Clear one chip; year/coin ranges clear both ends together. */
export function clearFilterChip(query: SearchQuery, key: keyof SearchQuery): SearchQuery {
  const next: SearchQuery = { ...query };
  if (key === "yearMin" || key === "yearMax") {
    next.yearMin = "";
    next.yearMax = "";
    return next;
  }
  if (key === "coinMin" || key === "coinMax") {
    next.coinMin = "";
    next.coinMax = "";
    return next;
  }
  if (key === "condition") {
    next.condition = "";
    return next;
  }
  if (key === "sort") {
    next.sort = DEFAULT_CARS_SORT;
    return next;
  }
  next[key] = "";
  return next;
}
