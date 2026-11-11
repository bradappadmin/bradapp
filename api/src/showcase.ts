import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

export type ShowcaseSource = "pinned" | "highest_value";

type ShowcaseQuery = Pick<Pool, "query"> | PoolConnection;

type ShowcasePickable = {
  id: number;
  coinPrice: number;
};

/**
 * Pick the public garage hero car.
 * 1. Pinned listing if still in the owned/available set
 * 2. Else highest coinPrice (tie → lowest listing id)
 * Empty set → null
 */
export function resolveShowcaseCar<T extends ShowcasePickable>(
  cars: T[],
  pinnedListingId: number | null | undefined,
): { car: T; source: ShowcaseSource } | null {
  if (cars.length === 0) return null;
  if (pinnedListingId != null && Number.isFinite(pinnedListingId)) {
    const pinned = cars.find((car) => car.id === Number(pinnedListingId));
    if (pinned) return { car: pinned, source: "pinned" };
  }
  let best = cars[0]!;
  for (const car of cars.slice(1)) {
    if (car.coinPrice > best.coinPrice) {
      best = car;
      continue;
    }
    if (car.coinPrice === best.coinPrice && car.id < best.id) {
      best = car;
    }
  }
  return { car: best, source: "highest_value" };
}

/** Clear any user pin that pointed at these listings (sold / traded away). */
export async function clearShowcaseForListings(
  connection: ShowcaseQuery,
  listingIds: number[],
): Promise<void> {
  const ids = [...new Set(listingIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  await connection.query(
    `UPDATE users SET showcase_listing_id = NULL WHERE showcase_listing_id IN (${placeholders})`,
    ids,
  );
}

export async function readShowcaseListingId(
  pool: ShowcaseQuery,
  userId: number,
): Promise<number | null> {
  const [rows] = await pool.query<(RowDataPacket & { showcase_listing_id: number | null })[]>(
    `SELECT showcase_listing_id FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  const raw = rows[0]?.showcase_listing_id;
  if (raw == null) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
