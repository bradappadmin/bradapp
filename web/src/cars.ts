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
  condition?: "new" | "used" | "";
  yearMin?: string;
  yearMax?: string;
  coinMin?: string;
  coinMax?: string;
  mileageMax?: string;
  bhpMin?: string;
  sort?: string;
};

export function formatCoins(n: number): string {
  return `${n.toLocaleString()} BC`;
}

export function formatMileage(n: number): string {
  return `${n.toLocaleString()} mi`;
}

export function listingTitle(listing: Pick<ListingSummary, "make" | "model" | "trimName">): string {
  return `${listing.make} ${listing.model}${listing.trimName ? ` ${listing.trimName}` : ""}`;
}
