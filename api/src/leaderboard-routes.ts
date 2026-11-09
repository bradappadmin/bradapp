import { Router, type Response } from "express";
import { requireAuth } from "./auth-middleware.js";
import { getPool, type RowDataPacket } from "./db.js";
import { isRole, roleLabel, type Role } from "./roles.js";

type LeaderboardRow = RowDataPacket & {
  id: number;
  display_name: string;
  role: string;
  coin_balance: number;
  win_count: number;
};

export function createLeaderboardRouter(): Router {
  const router = Router();

  /** Rank active accounts by Brad Coin balance; include Top Trumps wins. */
  router.get("/", requireAuth, async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<LeaderboardRow[]>(
      `SELECT u.id, u.display_name, u.role, u.coin_balance,
              (
                SELECT COUNT(*)
                FROM top_trumps_matches m
                WHERE (m.challenger_user_id = u.id AND m.winner = 'challenger')
                   OR (m.opponent_user_id = u.id AND m.winner = 'opponent')
              ) AS win_count
       FROM users u
       WHERE u.account_status = 'active'
       ORDER BY u.coin_balance DESC, u.display_name ASC`,
    );

    const entries = rows.map((row, index) => {
      const role: Role = isRole(row.role) ? row.role : "member";
      return {
        rank: index + 1,
        id: Number(row.id),
        displayName: row.display_name,
        role,
        roleLabel: roleLabel(role),
        coinBalance: Number(row.coin_balance),
        topTrumpsWins: Number(row.win_count),
      };
    });

    res.json({ entries });
  });

  return router;
}
