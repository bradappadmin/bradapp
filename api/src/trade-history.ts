import { getPool, type RowDataPacket } from "./db.js";

export type CompletedTradeCar = {
  listingId: number;
  make: string;
  model: string;
  trimName: string;
};

export type TradeHistoryStatus = "accepted" | "declined" | "cancelled";

export type CompletedTrade = {
  id: number;
  status: TradeHistoryStatus;
  resolvedAt: string;
  counterpartyName: string;
  /** Other member in this swap — for Trade again deep-links. */
  counterpartyUserId: number;
  /**
   * Listing the counterparty received (your `youGave`). Use as `theirCar` when
   * `theirCarAvailable` is true.
   */
  theirCarListingId: number;
  /** True when the counterparty still owns `theirCarListingId`. */
  theirCarAvailable: boolean;
  /** Car you gave away in this swap (or would have, if declined/cancelled). */
  youGave: CompletedTradeCar;
  /** Car you received in this swap (or would have, if declined/cancelled). */
  youGot: CompletedTradeCar;
  youWere: "offerer" | "receiver";
};

type TradeRow = RowDataPacket & {
  id: number;
  status: TradeHistoryStatus;
  from_user_id: number;
  to_user_id: number;
  offer_listing_id: number;
  request_listing_id: number;
  resolved_at: Date | string | null;
  created_at: Date | string;
  from_name: string;
  to_name: string;
  offer_make: string;
  offer_model: string;
  offer_trim: string;
  request_make: string;
  request_model: string;
  request_trim: string;
  offer_owner_user_id: number | null;
  request_owner_user_id: number | null;
};

function toIso(value: Date | string | null | undefined, fallback: Date | string): string {
  const raw = value ?? fallback;
  return raw instanceof Date ? raw.toISOString() : new Date(raw).toISOString();
}

/** Resolved free card trades (accepted, declined, cancelled) for this member, newest first. */
export async function listCompletedTrades(
  userId: number,
  limit = 40,
): Promise<CompletedTrade[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 100);
  const [rows] = await pool.query<TradeRow[]>(
    `SELECT
       t.id,
       t.status,
       t.from_user_id,
       t.to_user_id,
       t.offer_listing_id,
       t.request_listing_id,
       t.resolved_at,
       t.created_at,
       fu.display_name AS from_name,
       tu.display_name AS to_name,
       ocm.make AS offer_make,
       ocm.model AS offer_model,
       ocm.trim_name AS offer_trim,
       rcm.make AS request_make,
       rcm.model AS request_model,
       rcm.trim_name AS request_trim,
       ol.owner_user_id AS offer_owner_user_id,
       rl.owner_user_id AS request_owner_user_id
     FROM card_trade_offers t
     INNER JOIN users fu ON fu.id = t.from_user_id
     INNER JOIN users tu ON tu.id = t.to_user_id
     INNER JOIN listings ol ON ol.id = t.offer_listing_id
     INNER JOIN car_models ocm ON ocm.id = ol.car_model_id
     INNER JOIN listings rl ON rl.id = t.request_listing_id
     INNER JOIN car_models rcm ON rcm.id = rl.car_model_id
     WHERE t.status IN ('accepted', 'declined', 'cancelled')
       AND (t.from_user_id = ? OR t.to_user_id = ?)
     ORDER BY COALESCE(t.resolved_at, t.created_at) DESC, t.id DESC
     LIMIT ?`,
    [userId, userId, take],
  );

  return rows.map((row) => {
    const status = row.status as TradeHistoryStatus;
    const youWere: "offerer" | "receiver" =
      Number(row.from_user_id) === userId ? "offerer" : "receiver";
    const offerCar: CompletedTradeCar = {
      listingId: Number(row.offer_listing_id),
      make: String(row.offer_make),
      model: String(row.offer_model),
      trimName: String(row.offer_trim ?? ""),
    };
    const requestCar: CompletedTradeCar = {
      listingId: Number(row.request_listing_id),
      make: String(row.request_make),
      model: String(row.request_model),
      trimName: String(row.request_trim ?? ""),
    };
    // Offerer gave offer car, got request car. Receiver gave request car, got offer car.
    const youGave = youWere === "offerer" ? offerCar : requestCar;
    const youGot = youWere === "offerer" ? requestCar : offerCar;
    const counterpartyUserId =
      youWere === "offerer" ? Number(row.to_user_id) : Number(row.from_user_id);
    const counterpartyName =
      youWere === "offerer" ? String(row.to_name) : String(row.from_name);
    const theirCarListingId = youGave.listingId;
    const theirCarOwnerId =
      youWere === "offerer"
        ? row.offer_owner_user_id == null
          ? null
          : Number(row.offer_owner_user_id)
        : row.request_owner_user_id == null
          ? null
          : Number(row.request_owner_user_id);
    const theirCarAvailable =
      status === "accepted" && theirCarOwnerId === counterpartyUserId;

    return {
      id: Number(row.id),
      status,
      resolvedAt: toIso(row.resolved_at, row.created_at),
      counterpartyName,
      counterpartyUserId,
      theirCarListingId,
      theirCarAvailable,
      youGave,
      youGot,
      youWere,
    };
  });
}
