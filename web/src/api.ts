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
  reason: "seed" | "purchase" | "sale" | "admin_adjust";
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
