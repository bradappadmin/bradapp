/** Session compare tray — up to two listings picked from Cars or Favourites. */

export const COMPARE_SELECTION_KEY = "bradapp:compare-selection:v1";
export const COMPARE_SELECTION_LIMIT = 2;

export type ComparePick = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  year: number;
  coinPrice: number;
};

function isComparePick(value: unknown): value is ComparePick {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "number" &&
    Number.isFinite(row.id) &&
    row.id > 0 &&
    typeof row.make === "string" &&
    typeof row.model === "string" &&
    typeof row.trimName === "string" &&
    typeof row.year === "number" &&
    typeof row.coinPrice === "number"
  );
}

export function parseCompareSelection(raw: string | null): ComparePick[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isComparePick).slice(0, COMPARE_SELECTION_LIMIT);
  } catch {
    return [];
  }
}

export function loadCompareSelection(storage: Storage = sessionStorage): ComparePick[] {
  try {
    return parseCompareSelection(storage.getItem(COMPARE_SELECTION_KEY));
  } catch {
    return [];
  }
}

function writeCompareSelection(picks: ComparePick[], storage: Storage): ComparePick[] {
  const next = picks.slice(0, COMPARE_SELECTION_LIMIT);
  try {
    storage.setItem(COMPARE_SELECTION_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures.
  }
  return next;
}

export function clearCompareSelection(storage: Storage = sessionStorage): void {
  try {
    storage.removeItem(COMPARE_SELECTION_KEY);
  } catch {
    // ignore
  }
}

/** Add or refresh a pick. Returns the updated list (max 2). Replacing when full: newest replaces the older second slot if not already present. */
export function toggleComparePick(
  pick: ComparePick,
  storage: Storage = sessionStorage,
): { picks: ComparePick[]; added: boolean } {
  const current = loadCompareSelection(storage);
  const existing = current.findIndex((c) => c.id === pick.id);
  if (existing >= 0) {
    const without = current.filter((c) => c.id !== pick.id);
    return { picks: writeCompareSelection(without, storage), added: false };
  }
  if (current.length < COMPARE_SELECTION_LIMIT) {
    return { picks: writeCompareSelection([...current, pick], storage), added: true };
  }
  // Keep the first pick; replace the second with the new one.
  return { picks: writeCompareSelection([current[0]!, pick], storage), added: true };
}

export function isInCompareSelection(
  listingId: number,
  storage: Storage = sessionStorage,
): boolean {
  return loadCompareSelection(storage).some((c) => c.id === listingId);
}

export function compareHref(picks: ComparePick[]): string {
  if (picks.length < 2) return "/compare";
  return `/compare?a=${picks[0]!.id}&b=${picks[1]!.id}`;
}

export function toComparePick(car: {
  id: number;
  make: string;
  model: string;
  trimName?: string;
  year: number;
  coinPrice?: number;
}): ComparePick {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
    year: car.year,
    coinPrice: car.coinPrice ?? 0,
  };
}
