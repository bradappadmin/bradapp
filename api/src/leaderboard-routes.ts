import { Router, type Response } from "express";
import { requireAuth } from "./auth-middleware.js";
import { getPool, type RowDataPacket } from "./db.js";
import { isRole, roleLabel, type Role } from "./roles.js";
import { getWeeklyCupSnapshot } from "./weekly-cup.js";

type LeaderboardRow = RowDataPacket & {
  id: number;
  display_name: string;
  bio: string | null;
  role: string;
  coin_balance: number;
  win_count: number;
  highlight_listing_id: number | null;
  highlight_make: string | null;
  highlight_model: string | null;
  highlight_trim_name: string | null;
  highlight_body_type: string | null;
  highlight_colour: string | null;
  highlight_coin_price: number | null;
  highlight_bhp: number | null;
  highlight_top_speed_mph: number | null;
  highlight_zero_to_sixty_secs: number | null;
};

/**
 * Highlight car rule: among the member’s owned/available listings, pick the
 * highest coin_price; ties break to the lowest listing id (stable “first”).
 */
function mapHighlightCar(row: LeaderboardRow) {
  if (row.highlight_listing_id == null || row.highlight_make == null || row.highlight_model == null) {
    return null;
  }
  return {
    id: Number(row.highlight_listing_id),
    make: row.highlight_make,
    model: row.highlight_model,
    trimName: row.highlight_trim_name ?? "",
    bodyType: row.highlight_body_type ?? "",
    colour: row.highlight_colour ?? "Midnight Black",
    coinPrice: Number(row.highlight_coin_price ?? 0),
    bhp: Number(row.highlight_bhp ?? 0),
    topSpeedMph: Number(row.highlight_top_speed_mph ?? 0),
    zeroToSixtySecs: Number(row.highlight_zero_to_sixty_secs ?? 0),
  };
}

export function createLeaderboardRouter(): Router {
  const router = Router();

  /** Rank active accounts by Brad Coin balance; include Top Trumps wins + garage highlight. */
  router.get("/", requireAuth, async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<LeaderboardRow[]>(
      `SELECT u.id, u.display_name, u.bio, u.role, u.coin_balance,
              (
                SELECT COUNT(*)
                FROM top_trumps_matches m
                WHERE (m.challenger_user_id = u.id AND m.winner = 'challenger')
                   OR (m.opponent_user_id = u.id AND m.winner = 'opponent')
              ) AS win_count,
              hl.id AS highlight_listing_id,
              cm.make AS highlight_make,
              cm.model AS highlight_model,
              cm.trim_name AS highlight_trim_name,
              cm.body_type AS highlight_body_type,
              hl.colour AS highlight_colour,
              hl.coin_price AS highlight_coin_price,
              cm.bhp AS highlight_bhp,
              cm.top_speed_mph AS highlight_top_speed_mph,
              cm.zero_to_sixty_secs AS highlight_zero_to_sixty_secs
       FROM users u
       LEFT JOIN listings hl
         ON hl.id = (
           SELECT l.id
           FROM listings l
           WHERE l.owner_user_id = u.id
             AND l.status IN ('owned', 'available')
           ORDER BY l.coin_price DESC, l.id ASC
           LIMIT 1
         )
       LEFT JOIN car_models cm ON cm.id = hl.car_model_id
       WHERE u.account_status = 'active'
       ORDER BY u.coin_balance DESC, u.display_name ASC`,
    );

    const entries = rows.map((row, index) => {
      const role: Role = isRole(row.role) ? row.role : "member";
      const bio = row.bio && row.bio.trim().length > 0 ? row.bio.trim() : null;
      return {
        rank: index + 1,
        id: Number(row.id),
        displayName: row.display_name,
        bio,
        role,
        roleLabel: roleLabel(role),
        coinBalance: Number(row.coin_balance),
        topTrumpsWins: Number(row.win_count),
        highlightCar: mapHighlightCar(row),
      };
    });

    const weeklyCup = await getWeeklyCupSnapshot();
    res.json({ entries, weeklyCup });
  });

  return router;
}
