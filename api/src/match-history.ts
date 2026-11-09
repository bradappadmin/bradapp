import { getPool, type RowDataPacket } from "./db.js";
import {
  rewardForResult,
  type MatchWinner,
  type TopTrumpsCategory,
} from "./top-trumps.js";

export type MatchHistoryCar = {
  listingId: number | null;
  make: string;
  model: string;
  trimName: string;
  value: number;
};

export type MatchHistoryItem = {
  id: number;
  mode: "house" | "pvp";
  category: TopTrumpsCategory;
  createdAt: string;
  opponentName: string;
  yourCar: MatchHistoryCar;
  theirCar: MatchHistoryCar;
  result: "win" | "loss" | "draw";
  coinReward: number;
  youWere: "challenger" | "opponent";
};

type MatchRow = RowDataPacket & {
  id: number;
  mode: "house" | "pvp";
  category: TopTrumpsCategory;
  winner: MatchWinner;
  coin_reward: number;
  challenger_user_id: number;
  opponent_user_id: number | null;
  challenger_listing_id: number;
  opponent_listing_id: number | null;
  challenger_value: number;
  opponent_value: number;
  opponent_make: string;
  opponent_model: string;
  opponent_trim: string;
  created_at: Date | string;
  challenger_name: string;
  opponent_name: string | null;
  challenger_make: string | null;
  challenger_model: string | null;
  challenger_trim: string | null;
  opponent_listing_make: string | null;
  opponent_listing_model: string | null;
  opponent_listing_trim: string | null;
};

function resultForViewer(
  winner: MatchWinner,
  youWere: "challenger" | "opponent",
): "win" | "loss" | "draw" {
  if (winner === "draw") return "draw";
  if (winner === youWere) return "win";
  return "loss";
}

/** Past Top Trumps matches for this member (as challenger or opponent), newest first. */
export async function listMatchHistory(
  userId: number,
  limit = 40,
): Promise<MatchHistoryItem[]> {
  const pool = getPool();
  const take = Math.min(Math.max(limit, 1), 100);
  const [rows] = await pool.query<MatchRow[]>(
    `SELECT
       m.id,
       m.mode,
       m.category,
       m.winner,
       m.coin_reward,
       m.challenger_user_id,
       m.opponent_user_id,
       m.challenger_listing_id,
       m.opponent_listing_id,
       m.challenger_value,
       m.opponent_value,
       m.opponent_make,
       m.opponent_model,
       m.opponent_trim,
       m.created_at,
       cu.display_name AS challenger_name,
       ou.display_name AS opponent_name,
       ccm.make AS challenger_make,
       ccm.model AS challenger_model,
       ccm.trim_name AS challenger_trim,
       ocm.make AS opponent_listing_make,
       ocm.model AS opponent_listing_model,
       ocm.trim_name AS opponent_listing_trim
     FROM top_trumps_matches m
     INNER JOIN users cu ON cu.id = m.challenger_user_id
     LEFT JOIN users ou ON ou.id = m.opponent_user_id
     LEFT JOIN listings cl ON cl.id = m.challenger_listing_id
     LEFT JOIN car_models ccm ON ccm.id = cl.car_model_id
     LEFT JOIN listings ol ON ol.id = m.opponent_listing_id
     LEFT JOIN car_models ocm ON ocm.id = ol.car_model_id
     WHERE m.challenger_user_id = ? OR m.opponent_user_id = ?
     ORDER BY m.id DESC
     LIMIT ?`,
    [userId, userId, take],
  );

  return rows.map((row) => {
    const youWere: "challenger" | "opponent" =
      Number(row.challenger_user_id) === userId ? "challenger" : "opponent";
    const winner = row.winner;
    const result = resultForViewer(winner, youWere);
    const coinReward =
      youWere === "challenger"
        ? Number(row.coin_reward)
        : rewardForResult(winner, "opponent");

    const challengerCar: MatchHistoryCar = {
      listingId: Number(row.challenger_listing_id),
      make: String(row.challenger_make ?? "Unknown"),
      model: String(row.challenger_model ?? "car"),
      trimName: String(row.challenger_trim ?? ""),
      value: Number(row.challenger_value),
    };
    const theirStored: MatchHistoryCar = {
      listingId: row.opponent_listing_id == null ? null : Number(row.opponent_listing_id),
      make: String(row.opponent_listing_make ?? row.opponent_make ?? "House"),
      model: String(row.opponent_listing_model ?? row.opponent_model ?? "card"),
      trimName: String(row.opponent_listing_trim ?? row.opponent_trim ?? ""),
      value: Number(row.opponent_value),
    };

    const yourCar = youWere === "challenger" ? challengerCar : theirStored;
    const theirCar = youWere === "challenger" ? theirStored : challengerCar;
    const opponentName =
      row.mode === "house"
        ? "House"
        : youWere === "challenger"
          ? String(row.opponent_name ?? "Member")
          : String(row.challenger_name);

    return {
      id: Number(row.id),
      mode: row.mode,
      category: row.category,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
      opponentName,
      yourCar,
      theirCar,
      result,
      coinReward,
      youWere,
    };
  });
}
