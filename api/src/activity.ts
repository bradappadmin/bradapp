import { getPool, type RowDataPacket } from "./db.js";

export type ActivityKind = "purchase" | "sale" | "trade" | "top_trumps" | "review" | "gift";

/** Studio visual for the primary car on a feed row (SVG fallback on the client). */
export type ActivityCarVisual = {
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
};

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  summary: string;
  /** Member display name for the primary actor. */
  actorName: string;
  href: string | null;
  /** Primary car involved in the event, when known. */
  car: ActivityCarVisual | null;
  /** Catalogue listing for Open car → /cars/:id when known. */
  listingId: number | null;
};

/** Reviews have no listing paint — Midnight Black keeps studio photos on-brand. */
const REVIEW_STUDIO_COLOUR = "Midnight Black";

type LedgerRow = RowDataPacket & {
  id: number;
  reason: "purchase" | "sale";
  delta: number;
  created_at: Date;
  display_name: string;
  make: string | null;
  model: string | null;
  trim_name: string | null;
  body_type: string | null;
  colour: string | null;
  listing_id: number | null;
};

type TradeRow = RowDataPacket & {
  id: number;
  resolved_at: Date;
  from_name: string;
  to_name: string;
  offer_listing_id: number;
  offer_make: string;
  offer_model: string;
  offer_trim_name: string;
  offer_body_type: string;
  offer_colour: string;
  request_make: string;
  request_model: string;
};

type MatchRow = RowDataPacket & {
  id: number;
  created_at: Date;
  mode: "house" | "pvp";
  winner: "challenger" | "opponent" | "draw";
  category: string;
  challenger_name: string;
  opponent_name: string | null;
  opponent_make: string;
  opponent_model: string;
  challenger_listing_id: number | null;
  challenger_make: string | null;
  challenger_model: string | null;
  challenger_trim_name: string | null;
  challenger_body_type: string | null;
  challenger_colour: string | null;
};

type ReviewRow = RowDataPacket & {
  id: number;
  created_at: Date;
  title: string;
  display_name: string;
  review_type: "review" | "drag_race";
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  listing_id: number | null;
  b_make: string | null;
  b_model: string | null;
};

/** Prefer an available bay listing for Open car; fall back to owned/sold when needed. */
function listingIdForCarModelSql(carModelAlias: string): string {
  return `(SELECT l.id FROM listings l
     WHERE l.car_model_id = ${carModelAlias}.id
     ORDER BY CASE l.status
       WHEN 'available' THEN 0
       WHEN 'owned' THEN 1
       ELSE 2 END, l.id ASC
     LIMIT 1)`;
}

type GiftRow = RowDataPacket & {
  id: number;
  delta: number;
  created_at: Date;
  sender_name: string;
  receiver_name: string;
  receiver_id: number;
};

function categoryLabel(category: string): string {
  switch (category) {
    case "bhp":
      return "power";
    case "top_speed_mph":
      return "top speed";
    case "zero_to_sixty_secs":
      return "0–60";
    default:
      return category;
  }
}

function winnerPhrase(
  winner: MatchRow["winner"],
  challengerName: string,
  opponentLabel: string,
): string {
  switch (winner) {
    case "challenger":
      return `${challengerName} beat ${opponentLabel}`;
    case "opponent":
      return `${opponentLabel} beat ${challengerName}`;
    case "draw":
      return `${challengerName} drew with ${opponentLabel}`;
    default: {
      const _exhaustive: never = winner;
      return _exhaustive;
    }
  }
}

function carVisual(
  make: string | null | undefined,
  model: string | null | undefined,
  trimName: string | null | undefined,
  bodyType: string | null | undefined,
  colour: string | null | undefined,
): ActivityCarVisual | null {
  if (!make || !model) return null;
  return {
    make,
    model,
    trimName: trimName ?? "",
    bodyType: bodyType ?? "",
    colour: colour && colour.trim().length > 0 ? colour : "Midnight Black",
  };
}

export async function listFamilyActivity(limit = 30): Promise<ActivityItem[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 50);

  const [ledgerRows] = await pool.query<LedgerRow[]>(
    `SELECT cl.id, cl.reason, cl.delta, cl.created_at, cl.listing_id,
            u.display_name, cm.make, cm.model, cm.trim_name, cm.body_type, l.colour
     FROM coin_ledger cl
     INNER JOIN users u ON u.id = cl.user_id
     LEFT JOIN listings l ON l.id = cl.listing_id
     LEFT JOIN car_models cm ON cm.id = l.car_model_id
     WHERE cl.reason IN ('purchase', 'sale')
     ORDER BY cl.id DESC
     LIMIT ?`,
    [take],
  );

  const [tradeRows] = await pool.query<TradeRow[]>(
    `SELECT t.id, t.resolved_at, t.offer_listing_id,
            fu.display_name AS from_name, tu.display_name AS to_name,
            ocm.make AS offer_make, ocm.model AS offer_model,
            ocm.trim_name AS offer_trim_name, ocm.body_type AS offer_body_type,
            ol.colour AS offer_colour,
            rcm.make AS request_make, rcm.model AS request_model
     FROM card_trade_offers t
     INNER JOIN users fu ON fu.id = t.from_user_id
     INNER JOIN users tu ON tu.id = t.to_user_id
     INNER JOIN listings ol ON ol.id = t.offer_listing_id
     INNER JOIN car_models ocm ON ocm.id = ol.car_model_id
     INNER JOIN listings rl ON rl.id = t.request_listing_id
     INNER JOIN car_models rcm ON rcm.id = rl.car_model_id
     WHERE t.status = 'accepted' AND t.resolved_at IS NOT NULL
     ORDER BY t.resolved_at DESC
     LIMIT ?`,
    [take],
  );

  const [matchRows] = await pool.query<MatchRow[]>(
    `SELECT m.id, m.created_at, m.mode, m.winner, m.category,
            m.opponent_make, m.opponent_model, m.challenger_listing_id,
            cu.display_name AS challenger_name,
            ou.display_name AS opponent_name,
            ccm.make AS challenger_make, ccm.model AS challenger_model,
            ccm.trim_name AS challenger_trim_name, ccm.body_type AS challenger_body_type,
            cl.colour AS challenger_colour
     FROM top_trumps_matches m
     INNER JOIN users cu ON cu.id = m.challenger_user_id
     LEFT JOIN users ou ON ou.id = m.opponent_user_id
     LEFT JOIN listings cl ON cl.id = m.challenger_listing_id
     LEFT JOIN car_models ccm ON ccm.id = cl.car_model_id
     ORDER BY m.id DESC
     LIMIT ?`,
    [take],
  );

  const [reviewRows] = await pool.query<ReviewRow[]>(
    `SELECT r.id, r.created_at, r.title, r.review_type, u.display_name,
            cm.make, cm.model, cm.trim_name, cm.body_type,
            ${listingIdForCarModelSql("cm")} AS listing_id,
            cmb.make AS b_make, cmb.model AS b_model
     FROM video_reviews r
     INNER JOIN users u ON u.id = r.publisher_user_id
     INNER JOIN car_models cm ON cm.id = r.car_model_id
     LEFT JOIN car_models cmb ON cmb.id = r.car_model_b_id
     WHERE r.status = 'published'
     ORDER BY r.id DESC
     LIMIT ?`,
    [take],
  );

  // One feed row per gift_sent; pair with the matching gift_received for the receiver name.
  const [giftRows] = await pool.query<GiftRow[]>(
    `SELECT sent.id, sent.delta, sent.created_at,
            su.display_name AS sender_name,
            ru.display_name AS receiver_name,
            ru.id AS receiver_id
     FROM coin_ledger sent
     INNER JOIN users su ON su.id = sent.user_id
     INNER JOIN coin_ledger recv
       ON recv.reason = 'gift_received'
      AND recv.created_by_user_id = sent.user_id
      AND recv.delta = -sent.delta
      AND recv.id = (
        SELECT MIN(r.id)
        FROM coin_ledger r
        WHERE r.reason = 'gift_received'
          AND r.created_by_user_id = sent.user_id
          AND r.delta = -sent.delta
          AND r.id > sent.id
      )
     INNER JOIN users ru ON ru.id = recv.user_id
     WHERE sent.reason = 'gift_sent'
     ORDER BY sent.id DESC
     LIMIT ?`,
    [take],
  );

  const items: ActivityItem[] = [];

  for (const row of ledgerRows) {
    const carLabel =
      row.make && row.model ? `${row.make} ${row.model}` : `listing #${row.listing_id ?? "?"}`;
    const kind: ActivityKind = row.reason;
    const summary =
      kind === "purchase"
        ? `${row.display_name} bought ${carLabel} for ${Math.abs(Number(row.delta))} BC`
        : `${row.display_name} sold ${carLabel} for ${Math.abs(Number(row.delta))} BC`;
    items.push({
      id: `${kind}-${row.id}`,
      kind,
      createdAt: new Date(row.created_at).toISOString(),
      summary,
      actorName: row.display_name,
      href: row.listing_id != null ? `/cars/${row.listing_id}` : null,
      car: carVisual(row.make, row.model, row.trim_name, row.body_type, row.colour),
      listingId: row.listing_id == null ? null : Number(row.listing_id),
    });
  }

  for (const row of tradeRows) {
    items.push({
      id: `trade-${row.id}`,
      kind: "trade",
      createdAt: new Date(row.resolved_at).toISOString(),
      summary: `${row.from_name} and ${row.to_name} swapped ${row.offer_make} ${row.offer_model} for ${row.request_make} ${row.request_model}`,
      actorName: row.from_name,
      href: "/trades",
      car: carVisual(
        row.offer_make,
        row.offer_model,
        row.offer_trim_name,
        row.offer_body_type,
        row.offer_colour,
      ),
      listingId: Number(row.offer_listing_id),
    });
  }

  for (const row of matchRows) {
    const opponentLabel =
      row.mode === "house"
        ? `the house (${row.opponent_make} ${row.opponent_model})`
        : (row.opponent_name ?? `${row.opponent_make} ${row.opponent_model}`);
    const carBit =
      row.challenger_make && row.challenger_model
        ? ` with a ${row.challenger_make} ${row.challenger_model}`
        : "";
    items.push({
      id: `top_trumps-${row.id}`,
      kind: "top_trumps",
      createdAt: new Date(row.created_at).toISOString(),
      summary: `${winnerPhrase(row.winner, row.challenger_name, opponentLabel)}${carBit} on ${categoryLabel(row.category)}`,
      actorName: row.challenger_name,
      href: "/play",
      car: carVisual(
        row.challenger_make,
        row.challenger_model,
        row.challenger_trim_name,
        row.challenger_body_type,
        row.challenger_colour,
      ),
      listingId:
        row.challenger_listing_id == null ? null : Number(row.challenger_listing_id),
    });
  }

  for (const row of reviewRows) {
    const cars =
      row.review_type === "drag_race" && row.b_make && row.b_model
        ? `${row.make} ${row.model} vs ${row.b_make} ${row.b_model}`
        : `${row.make} ${row.model}`;
    items.push({
      id: `review-${row.id}`,
      kind: "review",
      createdAt: new Date(row.created_at).toISOString(),
      summary: `${row.display_name} published “${row.title}” (${cars})`,
      actorName: row.display_name,
      href: `/reviews/${row.id}`,
      car: carVisual(row.make, row.model, row.trim_name, row.body_type, REVIEW_STUDIO_COLOUR),
      listingId: row.listing_id == null ? null : Number(row.listing_id),
    });
  }

  for (const row of giftRows) {
    const amount = Math.abs(Number(row.delta));
    items.push({
      id: `gift-${row.id}`,
      kind: "gift",
      createdAt: new Date(row.created_at).toISOString(),
      summary: `${row.sender_name} gifted ${amount} BC to ${row.receiver_name}`,
      actorName: row.sender_name,
      href: `/members/${row.receiver_id}`,
      car: null,
      listingId: null,
    });
  }

  items.sort((a, b) => {
    const byTime = b.createdAt.localeCompare(a.createdAt);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });

  return items.slice(0, take);
}
