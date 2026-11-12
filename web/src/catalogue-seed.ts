/**
 * Sample midnight-garage catalogue for static publish-app hosting.
 * Used when the MySQL API is unreachable (no VITE_API_URL / no backend).
 * Built from the same seed models/garages as api/src/car-seed-data.ts.
 */
import {
  SEED_CAR_MODELS,
  SEED_GARAGES,
  buildSeedListings,
  type SeedCarModel,
  type SeedGarage,
} from "./car-seed-data";
import type { CarFilters, ListingDetail, ListingSummary, SearchQuery } from "./cars";
import { DEFAULT_CARS_SORT, parseCarsSort, type CarsSort } from "./cars-sort";

type SeedListingDetail = ListingDetail;

function modelKey(make: string, model: string, trimName: string): string {
  return `${make}|${model}|${trimName}`;
}

function garageByName(): Map<string, SeedGarage> {
  return new Map(SEED_GARAGES.map((g) => [g.name, g]));
}

function modelByKey(): Map<string, SeedCarModel> {
  return new Map(
    SEED_CAR_MODELS.map((m) => [modelKey(m.make, m.model, m.trimName), m]),
  );
}

/** Stable 1-based ids so deep links stay consistent across reloads. */
export function buildSampleListings(): SeedListingDetail[] {
  const models = modelByKey();
  const garages = garageByName();
  const out: SeedListingDetail[] = [];
  let id = 1;
  for (const seed of buildSeedListings()) {
    const car = models.get(modelKey(seed.make, seed.model, seed.trimName));
    const garage = garages.get(seed.garageName);
    if (!car || !garage) continue;
    out.push({
      id,
      make: car.make,
      model: car.model,
      trimName: car.trimName,
      bodyType: car.bodyType,
      fuel: car.fuel,
      drivetrain: car.drivetrain,
      bhp: car.bhp,
      topSpeedMph: car.topSpeedMph,
      zeroToSixtySecs: car.zeroToSixtySecs,
      conditionType: seed.conditionType,
      year: seed.year,
      colour: seed.colour,
      mileage: seed.mileage,
      coinPrice: seed.coinPrice,
      ownerLabel: seed.ownerLabel,
      ownerUserId: null,
      status: "available",
      garageName: garage.name,
      garageCity: garage.city,
      doors: car.doors,
      seats: car.seats,
      garageTagline: garage.tagline,
    });
    id += 1;
  }
  return out;
}

let cachedListings: SeedListingDetail[] | null = null;

function allListings(): SeedListingDetail[] {
  if (!cachedListings) cachedListings = buildSampleListings();
  return cachedListings;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function sampleCarFilters(): CarFilters {
  const listings = allListings();
  const years = listings.map((l) => l.year);
  const prices = listings.map((l) => l.coinPrice);
  const garageMap = new Map<string, { name: string; city: string }>();
  for (const l of listings) {
    garageMap.set(l.garageName, { name: l.garageName, city: l.garageCity });
  }
  return {
    makes: uniqueSorted(listings.map((l) => l.make)),
    models: uniqueSorted(listings.map((l) => l.model)),
    bodyTypes: uniqueSorted(listings.map((l) => l.bodyType)),
    fuels: uniqueSorted(listings.map((l) => l.fuel)),
    colours: uniqueSorted(listings.map((l) => l.colour)),
    garages: [...garageMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    conditions: ["new", "used"],
    yearMin: years.length ? Math.min(...years) : 0,
    yearMax: years.length ? Math.max(...years) : 0,
    coinPriceMin: prices.length ? Math.min(...prices) : 0,
    coinPriceMax: prices.length ? Math.max(...prices) : 0,
  };
}

export function sampleModels(make?: string): string[] {
  const listings = allListings();
  const filtered = make
    ? listings.filter((l) => l.make === make)
    : listings;
  return uniqueSorted(filtered.map((l) => l.model));
}

function parseOptionalInt(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function matchesQuery(listing: ListingSummary, query: SearchQuery): boolean {
  const q = query.q?.trim().toLowerCase();
  if (q) {
    const hay = `${listing.make} ${listing.model} ${listing.trimName} ${listing.garageName}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (query.make && listing.make !== query.make) return false;
  if (query.model && listing.model !== query.model) return false;
  if (query.bodyType && listing.bodyType !== query.bodyType) return false;
  if (query.fuel && listing.fuel !== query.fuel) return false;
  if (query.colour && listing.colour !== query.colour) return false;
  if (query.garage && listing.garageName !== query.garage) return false;
  if (query.condition === "new" || query.condition === "used") {
    if (listing.conditionType !== query.condition) return false;
  }
  const yearMin = parseOptionalInt(query.yearMin);
  if (yearMin != null && listing.year < yearMin) return false;
  const yearMax = parseOptionalInt(query.yearMax);
  if (yearMax != null && listing.year > yearMax) return false;
  const coinMin = parseOptionalInt(query.coinMin);
  if (coinMin != null && listing.coinPrice < coinMin) return false;
  const coinMax = parseOptionalInt(query.coinMax);
  if (coinMax != null && listing.coinPrice > coinMax) return false;
  const mileageMax = parseOptionalInt(query.mileageMax);
  if (mileageMax != null && listing.mileage > mileageMax) return false;
  const bhpMin = parseOptionalInt(query.bhpMin);
  if (bhpMin != null && listing.bhp < bhpMin) return false;
  return true;
}

function compareListings(a: ListingSummary, b: ListingSummary, sort: CarsSort): number {
  switch (sort) {
    case "price_asc":
      return a.coinPrice - b.coinPrice || a.id - b.id;
    case "price_desc":
      return b.coinPrice - a.coinPrice || a.id - b.id;
    case "name_asc": {
      const left = `${a.make} ${a.model} ${a.trimName}`;
      const right = `${b.make} ${b.model} ${b.trimName}`;
      return left.localeCompare(right) || b.coinPrice - a.coinPrice || a.id - b.id;
    }
    case "name_desc": {
      const left = `${a.make} ${a.model} ${a.trimName}`;
      const right = `${b.make} ${b.model} ${b.trimName}`;
      return right.localeCompare(left) || b.coinPrice - a.coinPrice || a.id - b.id;
    }
    default: {
      const _exhaustive: never = sort;
      void _exhaustive;
      return a.id - b.id;
    }
  }
}

function toSummary(listing: SeedListingDetail): ListingSummary {
  const {
    doors: _doors,
    seats: _seats,
    garageTagline: _tagline,
    ...summary
  } = listing;
  return summary;
}

export function searchSampleCars(params: SearchQuery): {
  total: number;
  limit: number;
  offset: number;
  listings: ListingSummary[];
} {
  const sort = parseCarsSort(params.sort ?? DEFAULT_CARS_SORT);
  const matched = allListings()
    .filter((l) => matchesQuery(l, params))
    .sort((a, b) => compareListings(a, b, sort));
  const limit = 40;
  const offset = 0;
  return {
    total: matched.length,
    limit,
    offset,
    listings: matched.slice(offset, offset + limit).map(toSummary),
  };
}

export function sampleListing(id: number): ListingDetail | null {
  return allListings().find((l) => l.id === id) ?? null;
}
