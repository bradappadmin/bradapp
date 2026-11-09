import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";

export type FavouriteCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  status: "available" | "owned" | "sold";
  ownerLabel: string;
  garageName: string;
  garageCity: string;
  favouritedAt: string;
};

export async function isListingFavourited(userId: number, listingId: number): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM favourites WHERE user_id = ? AND listing_id = ? LIMIT 1`,
    [userId, listingId],
  );
  return rows.length > 0;
}

export async function listingExists(listingId: number): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM listings WHERE id = ? LIMIT 1`,
    [listingId],
  );
  return rows.length > 0;
}

export async function addFavourite(userId: number, listingId: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO favourites (user_id, listing_id) VALUES (?, ?)`,
    [userId, listingId],
  );
  return result.affectedRows > 0;
}

export async function removeFavourite(userId: number, listingId: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM favourites WHERE user_id = ? AND listing_id = ?`,
    [userId, listingId],
  );
  return result.affectedRows > 0;
}

export async function listFavourites(userId: number): Promise<FavouriteCar[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       l.id,
       cm.make,
       cm.model,
       cm.trim_name AS trimName,
       cm.body_type AS bodyType,
       cm.bhp,
       cm.top_speed_mph AS topSpeedMph,
       cm.zero_to_sixty_secs AS zeroToSixtySecs,
       l.condition_type AS conditionType,
       l.year,
       l.colour,
       l.mileage,
       l.coin_price AS coinPrice,
       l.status,
       l.owner_label AS ownerLabel,
       g.name AS garageName,
       g.city AS garageCity,
       f.created_at AS favouritedAt
     FROM favourites f
     INNER JOIN listings l ON l.id = f.listing_id
     INNER JOIN car_models cm ON cm.id = l.car_model_id
     INNER JOIN garages g ON g.id = l.garage_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => ({
    id: Number(row.id),
    make: String(row.make),
    model: String(row.model),
    trimName: String(row.trimName),
    bodyType: String(row.bodyType),
    bhp: Number(row.bhp),
    topSpeedMph: Number(row.topSpeedMph),
    zeroToSixtySecs: Number(row.zeroToSixtySecs),
    conditionType: row.conditionType as "new" | "used",
    year: Number(row.year),
    colour: String(row.colour),
    mileage: Number(row.mileage),
    coinPrice: Number(row.coinPrice),
    status: row.status as "available" | "owned" | "sold",
    ownerLabel: String(row.ownerLabel),
    garageName: String(row.garageName),
    garageCity: String(row.garageCity),
    favouritedAt:
      row.favouritedAt instanceof Date
        ? row.favouritedAt.toISOString()
        : String(row.favouritedAt),
  }));
}
