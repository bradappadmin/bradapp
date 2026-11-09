import { getPool, type RowDataPacket } from "./db.js";

export type ActivityKind = "purchase" | "sale" | "trade" | "top_trumps" | "review";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  summary: string;
  actorName: string;
  href: string | null;
};

type LedgerRow = RowDataPacket & {
  id: number;
  reason: "purchase" | "sale";
  delta: number;
  created_at: Date;
  display_name: string;
  make: string | null;
  model: string | null;
  listing_id: number | null;
};

type TradeRow = RowDataPacket & {
  id: number;
  resolved_at: Date;
  from_name: string;
  to_name: string;
  offer_make: string;
  offer_model: string;
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
  challenger_make: string | null;
  challenger_model: string | null;
};

type ReviewRow = RowDataPacket & {
  id: number;
  created_at: Date;
  title: string;
  display_name: string;
  review_type: "review" | "drag_race";
  make: string;
  model: string;
  b_make: string | null;
  b_model: string | null;
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

export async function listFamilyActivity(limit = 30): Promise<ActivityItem[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 50);

  const [ledgerRows] = await pool.query<LedgerRow[]>(
    `SELECT cl.id, cl.reason, cl.delta, cl.created_at, cl.listing_id,
            u.display_name, cm.make, cm.model
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
    `SELECT t.id, t.resolved_at,
            fu.display_name AS from_name, tu.display_name AS to_name,
            ocm.make AS offer_make, ocm.model AS offer_model,
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
            m.opponent_make, m.opponent_model,
            cu.display_name AS challenger_name,
            ou.display_name AS opponent_name,
            ccm.make AS challenger_make, ccm.model AS challenger_model
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
    `SELECT r.id, r.created_at, r.title, r.review_type, u.display_name, cm.make, cm.model,
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

  const items: ActivityItem[] = [];

  for (const row of ledgerRows) {
    const car =
      row.make && row.model ? `${row.make} ${row.model}` : `listing #${row.listing_id ?? "?"}`;
    const kind: ActivityKind = row.reason;
    const summary =
      kind === "purchase"
        ? `${row.display_name} bought ${car} for ${Math.abs(Number(row.delta))} BC`
        : `${row.display_name} sold ${car} for ${Math.abs(Number(row.delta))} BC`;
    items.push({
      id: `${kind}-${row.id}`,
      kind,
      createdAt: new Date(row.created_at).toISOString(),
      summary,
      actorName: row.display_name,
      href: row.listing_id != null ? `/cars/${row.listing_id}` : null,
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
    });
  }

  items.sort((a, b) => {
    const byTime = b.createdAt.localeCompare(a.createdAt);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });

  return items.slice(0, take);
}
