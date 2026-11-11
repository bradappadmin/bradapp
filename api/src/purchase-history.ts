import { getPool, type RowDataPacket } from "./db.js";

export type PurchasedCar = {
  ledgerId: number;
  listingId: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number;
  paidPrice: number;
  purchasedAt: string;
  sellerDisplayName: string | null;
};

type PurchaseRow = RowDataPacket & {
  ledger_id: number;
  listing_id: number;
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  colour: string;
  year: number;
  paid_price: number;
  purchased_at: Date | string;
  seller_display_name: string | null;
};

/** Cars this member bought (ledger reason `purchase`), newest first. Seller from matching sale when available. */
export async function listPurchaseHistory(
  userId: number,
  limit = 50,
): Promise<PurchasedCar[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 100);
  const [rows] = await pool.query<PurchaseRow[]>(
    `SELECT
       purchase.id AS ledger_id,
       purchase.listing_id,
       cm.make,
       cm.model,
       cm.trim_name,
       cm.body_type,
       l.colour,
       l.year,
       ABS(purchase.delta) AS paid_price,
       purchase.created_at AS purchased_at,
       (
         SELECT u.display_name
         FROM coin_ledger sale
         INNER JOIN users u ON u.id = sale.user_id
         WHERE sale.listing_id = purchase.listing_id
           AND sale.reason = 'sale'
           AND sale.delta = ABS(purchase.delta)
         ORDER BY ABS(TIMESTAMPDIFF(SECOND, sale.created_at, purchase.created_at)) ASC,
                  sale.id DESC
         LIMIT 1
       ) AS seller_display_name
     FROM coin_ledger purchase
     INNER JOIN listings l ON l.id = purchase.listing_id
     INNER JOIN car_models cm ON cm.id = l.car_model_id
     WHERE purchase.user_id = ?
       AND purchase.reason = 'purchase'
       AND purchase.listing_id IS NOT NULL
     ORDER BY purchase.created_at DESC, purchase.id DESC
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
    paidPrice: Number(row.paid_price),
    purchasedAt:
      row.purchased_at instanceof Date
        ? row.purchased_at.toISOString()
        : new Date(row.purchased_at).toISOString(),
    sellerDisplayName: row.seller_display_name ? String(row.seller_display_name) : null,
  }));
}
