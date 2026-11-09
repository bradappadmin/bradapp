import { getPool, type RowDataPacket } from "./db.js";

export type SoldCar = {
  ledgerId: number;
  listingId: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number;
  soldPrice: number;
  soldAt: string;
  buyerDisplayName: string | null;
};

type SoldRow = RowDataPacket & {
  ledger_id: number;
  listing_id: number;
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  colour: string;
  year: number;
  sold_price: number;
  sold_at: Date | string;
  buyer_display_name: string | null;
};

/** Cars this member sold (ledger reason `sale`), newest first. Buyer from matching purchase when available. */
export async function listSoldHistory(userId: number, limit = 50): Promise<SoldCar[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 100);
  const [rows] = await pool.query<SoldRow[]>(
    `SELECT
       sale.id AS ledger_id,
       sale.listing_id,
       cm.make,
       cm.model,
       cm.trim_name,
       cm.body_type,
       l.colour,
       l.year,
       sale.delta AS sold_price,
       sale.created_at AS sold_at,
       (
         SELECT u.display_name
         FROM coin_ledger purchase
         INNER JOIN users u ON u.id = purchase.user_id
         WHERE purchase.listing_id = sale.listing_id
           AND purchase.reason = 'purchase'
           AND purchase.delta = -sale.delta
         ORDER BY ABS(TIMESTAMPDIFF(SECOND, purchase.created_at, sale.created_at)) ASC,
                  purchase.id DESC
         LIMIT 1
       ) AS buyer_display_name
     FROM coin_ledger sale
     INNER JOIN listings l ON l.id = sale.listing_id
     INNER JOIN car_models cm ON cm.id = l.car_model_id
     WHERE sale.user_id = ?
       AND sale.reason = 'sale'
       AND sale.listing_id IS NOT NULL
     ORDER BY sale.created_at DESC, sale.id DESC
     LIMIT ?`,
    [userId, take],
  );

  return rows.map((row) => ({
    ledgerId: Number(row.ledger_id),
    listingId: Number(row.listing_id),
    make: String(row.make),
    model: String(row.model),
    trimName: String(row.trim_name),
    bodyType: String(row.body_type),
    colour: String(row.colour),
    year: Number(row.year),
    soldPrice: Number(row.sold_price),
    soldAt:
      row.sold_at instanceof Date ? row.sold_at.toISOString() : new Date(row.sold_at).toISOString(),
    buyerDisplayName: row.buyer_display_name ? String(row.buyer_display_name) : null,
  }));
}
