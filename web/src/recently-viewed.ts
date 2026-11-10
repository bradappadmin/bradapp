/** Recently opened car listings — stored in localStorage on this device. */

export const RECENTLY_VIEWED_KEY = "bradapp:recently-viewed:v1";
export const RECENTLY_VIEWED_LIMIT = 6;

export type RecentlyViewedCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  coinPrice: number;
  status: string;
  viewedAt: number;
};

function isRecentCar(value: unknown): value is RecentlyViewedCar {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "number" &&
    Number.isFinite(row.id) &&
    row.id > 0 &&
    typeof row.make === "string" &&
    typeof row.model === "string" &&
    typeof row.trimName === "string" &&
    typeof row.bodyType === "string" &&
    typeof row.colour === "string" &&
    typeof row.year === "number" &&
    typeof row.bhp === "number" &&
    typeof row.topSpeedMph === "number" &&
    typeof row.zeroToSixtySecs === "number" &&
    typeof row.coinPrice === "number" &&
    typeof row.status === "string" &&
    typeof row.viewedAt === "number"
  );
}

export function parseRecentlyViewed(raw: string | null): RecentlyViewedCar[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentCar).slice(0, RECENTLY_VIEWED_LIMIT);
  } catch {
    return [];
  }
}

export function loadRecentlyViewed(storage: Storage = localStorage): RecentlyViewedCar[] {
  try {
    return parseRecentlyViewed(storage.getItem(RECENTLY_VIEWED_KEY));
  } catch {
    return [];
  }
}

export function rememberRecentlyViewed(
  listing: Omit<RecentlyViewedCar, "viewedAt">,
  storage: Storage = localStorage,
  now = Date.now(),
): RecentlyViewedCar[] {
  const next: RecentlyViewedCar = { ...listing, viewedAt: now };
  const previous = loadRecentlyViewed(storage).filter((car) => car.id !== listing.id);
  const merged = [next, ...previous].slice(0, RECENTLY_VIEWED_LIMIT);
  try {
    storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(merged));
  } catch {
    // Ignore quota / private-mode failures.
  }
  return merged;
}

/** Wipe the device recently-viewed list. */
export function clearRecentlyViewed(storage: Storage = localStorage): void {
  try {
    storage.removeItem(RECENTLY_VIEWED_KEY);
  } catch {
    // Ignore private-mode failures.
  }
}
