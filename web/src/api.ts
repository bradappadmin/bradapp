import type { CarFilters, ListingDetail, ListingSummary, SearchQuery } from "./cars";
import type { User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const err = (body ?? {}) as ApiErrorBody;
    throw new Error(err.message ?? "Request failed");
  }

  return body as T;
}

export function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: User }> {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signIn(input: { email: string; password: string }): Promise<{ user: User }> {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signOut(): Promise<{ ok: boolean }> {
  return request("/auth/signout", { method: "POST" });
}

export function fetchMe(): Promise<{ user: User }> {
  return request("/auth/me");
}

function toQuery(params: SearchQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function fetchCarFilters(): Promise<{ filters: CarFilters }> {
  return request("/cars/filters");
}

export function searchCars(
  params: SearchQuery,
): Promise<{ total: number; limit: number; offset: number; listings: ListingSummary[] }> {
  return request(`/cars/search${toQuery(params)}`);
}

export function fetchListing(id: number): Promise<{ listing: ListingDetail }> {
  return request(`/cars/listings/${id}`);
}

export function fetchModels(make?: string): Promise<{ models: string[] }> {
  return request(`/cars/models${toQuery({ make: make ?? "" })}`);
}

export type LedgerEntry = {
  id: number;
  delta: number;
  balanceAfter: number;
  reason: "seed" | "purchase" | "sale" | "admin_adjust" | "play_reward";
  listingId: number | null;
  note: string;
  createdAt: string;
};

export type GarageCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  status: "available" | "owned" | "sold";
  ownerLabel: string;
  garageName: string;
  garageCity: string;
};

export function fetchWallet(): Promise<{ balance: number; ledger: LedgerEntry[] }> {
  return request("/trade/wallet");
}

export function fetchGarage(): Promise<{ cars: GarageCar[] }> {
  return request("/trade/garage");
}

export function buyListing(id: number): Promise<{ ok: boolean; listingId: number; coinPrice: number; balance: number }> {
  return request(`/trade/listings/${id}/buy`, { method: "POST" });
}

export function sellListing(
  id: number,
  coinPrice: number,
): Promise<{ ok: boolean; listingId: number; coinPrice: number; status: "available" }> {
  return request(`/trade/listings/${id}/sell`, {
    method: "POST",
    body: JSON.stringify({ coinPrice }),
  });
}

export function unlistListing(id: number): Promise<{ ok: boolean; listingId: number; status: "owned" }> {
  return request(`/trade/listings/${id}/unlist`, { method: "POST" });
}

export type TopTrumpsCategory = "bhp" | "top_speed_mph" | "zero_to_sixty_secs";

export type MemberCard = {
  id: number;
  ownerUserId: number;
  ownerDisplayName: string;
  make: string;
  model: string;
  trimName: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  year: number;
  colour: string;
};

export type TradeRow = {
  id: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  fromUserId: number;
  toUserId: number;
  offerListingId: number;
  requestListingId: number;
  fromDisplayName: string;
  toDisplayName: string;
  offerMake: string;
  offerModel: string;
  requestMake: string;
  requestModel: string;
  createdAt: string;
};

export function fetchTopTrumpsCategories(): Promise<{
  categories: Array<{ id: TopTrumpsCategory; label: string; direction: "higher" | "lower" }>;
  rewards: { win: number; play: number };
}> {
  return request("/play/top-trumps/categories");
}

export function playTopTrumpsHouse(input: {
  listingId: number;
  category: TopTrumpsCategory;
}): Promise<{
  match: {
    id: number;
    winner: "challenger" | "opponent" | "draw";
    coinReward: number;
    challengerValue: number;
    opponentValue: number;
    category: TopTrumpsCategory;
    opponent: { make: string; model: string; trimName: string };
  };
  balance: number;
}> {
  return request("/play/top-trumps/house", { method: "POST", body: JSON.stringify(input) });
}

export function playTopTrumpsPvp(input: {
  listingId: number;
  opponentListingId: number;
  category: TopTrumpsCategory;
}): Promise<{
  match: {
    id: number;
    winner: "challenger" | "opponent" | "draw";
    coinReward: number;
    challengerValue: number;
    opponentValue: number;
    category: TopTrumpsCategory;
    opponent: { make: string; model: string; trimName: string; userId: number };
  };
  balance: number;
}> {
  return request("/play/top-trumps/pvp", { method: "POST", body: JSON.stringify(input) });
}

export function fetchMemberCards(): Promise<{ cards: MemberCard[] }> {
  return request("/play/cards/members");
}

export function fetchTrades(): Promise<{ trades: TradeRow[] }> {
  return request("/play/trades");
}

export function createTrade(input: {
  offerListingId: number;
  requestListingId: number;
}): Promise<{ trade: { id: number; status: string } }> {
  return request("/play/trades", { method: "POST", body: JSON.stringify(input) });
}

export function acceptTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/accept`, { method: "POST" });
}

export function declineTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/decline`, { method: "POST" });
}

export function cancelTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/cancel`, { method: "POST" });
}
