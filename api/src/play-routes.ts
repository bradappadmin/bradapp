import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "./auth-middleware.js";
import { applyCoinDelta } from "./coins.js";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import {
  PLAY_COINS,
  WIN_COINS,
  decideWinner,
  isTopTrumpsCategory,
  rewardForResult,
  type TopTrumpsCategory,
} from "./top-trumps.js";

const categorySchema = z.enum(["bhp", "top_speed_mph", "zero_to_sixty_secs"]);

const housePlaySchema = z.object({
  listingId: z.number().int().positive(),
  category: categorySchema,
});

const pvpPlaySchema = z.object({
  listingId: z.number().int().positive(),
  opponentListingId: z.number().int().positive(),
  category: categorySchema,
});

const tradeSchema = z.object({
  offerListingId: z.number().int().positive(),
  requestListingId: z.number().int().positive(),
});

type OwnedCardRow = RowDataPacket & {
  id: number;
  owner_user_id: number | null;
  status: string;
  make: string;
  model: string;
  trim_name: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
};

type HouseCardRow = RowDataPacket & {
  make: string;
  model: string;
  trim_name: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
};

function cardValue(row: { bhp: number; top_speed_mph: number; zero_to_sixty_secs: number }, category: TopTrumpsCategory): number {
  switch (category) {
    case "bhp":
      return Number(row.bhp);
    case "top_speed_mph":
      return Number(row.top_speed_mph);
    case "zero_to_sixty_secs":
      return Number(row.zero_to_sixty_secs);
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

async function loadOwnedCard(listingId: number): Promise<OwnedCardRow | null> {
  const pool = getPool();
  const [rows] = await pool.query<OwnedCardRow[]>(
    `SELECT l.id, l.owner_user_id, l.status, cm.make, cm.model, cm.trim_name,
            cm.bhp, cm.top_speed_mph, cm.zero_to_sixty_secs
     FROM listings l
     INNER JOIN car_models cm ON cm.id = l.car_model_id
     WHERE l.id = ?
     LIMIT 1`,
    [listingId],
  );
  return rows[0] ?? null;
}

export function createPlayRouter(): Router {
  const router = Router();

  router.get("/top-trumps/categories", (_req, res: Response) => {
    res.json({
      categories: [
        { id: "bhp", label: "Power (BHP)", direction: "higher" },
        { id: "top_speed_mph", label: "Top speed", direction: "higher" },
        { id: "zero_to_sixty_secs", label: "0–60", direction: "lower" },
      ],
      rewards: { win: WIN_COINS, play: PLAY_COINS },
    });
  });

  router.get("/top-trumps/history", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, mode, category, challenger_value AS challengerValue, opponent_value AS opponentValue,
              winner, coin_reward AS coinReward, opponent_make AS opponentMake, opponent_model AS opponentModel,
              created_at AS createdAt
       FROM top_trumps_matches
       WHERE challenger_user_id = ? OR opponent_user_id = ?
       ORDER BY id DESC
       LIMIT 30`,
      [user.id, user.id],
    );
    res.json({ matches: rows });
  });

  /** Play vs the house: your owned car against a random model. */
  router.post("/top-trumps/house", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const parsed = housePlaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid play request",
      });
      return;
    }
    const { listingId, category } = parsed.data;
    if (!isTopTrumpsCategory(category)) {
      res.status(400).json({ error: "validation_error", message: "Unknown category" });
      return;
    }

    const card = await loadOwnedCard(listingId);
    if (!card || Number(card.owner_user_id) !== user.id) {
      res.status(403).json({ error: "forbidden", message: "Pick a car you own." });
      return;
    }

    const pool = getPool();
    const [houseRows] = await pool.query<HouseCardRow[]>(
      `SELECT make, model, trim_name, bhp, top_speed_mph, zero_to_sixty_secs
       FROM car_models
       ORDER BY RAND()
       LIMIT 1`,
    );
    const house = houseRows[0];
    if (!house) {
      res.status(500).json({ error: "no_cards", message: "No house cards available." });
      return;
    }

    const challengerValue = cardValue(card, category);
    const opponentValue = cardValue(house, category);
    const winner = decideWinner(category, challengerValue, opponentValue);
    const coinReward = rewardForResult(winner, "challenger");

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [insert] = await connection.query<ResultSetHeader>(
        `INSERT INTO top_trumps_matches
          (challenger_user_id, opponent_user_id, challenger_listing_id, opponent_listing_id,
           opponent_make, opponent_model, opponent_trim, category,
           challenger_value, opponent_value, winner, coin_reward, mode)
         VALUES (?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'house')`,
        [
          user.id,
          listingId,
          house.make,
          house.model,
          house.trim_name,
          category,
          challengerValue,
          opponentValue,
          winner,
          coinReward,
        ],
      );
      const balance = await applyCoinDelta(connection, {
        userId: user.id,
        delta: coinReward,
        reason: "play_reward",
        listingId,
        note: `Top Trumps vs house (${category})`,
      });
      await connection.commit();
      res.status(201).json({
        match: {
          id: Number(insert.insertId),
          mode: "house",
          category,
          challengerValue,
          opponentValue,
          winner,
          coinReward,
          opponent: {
            make: house.make,
            model: house.model,
            trimName: house.trim_name,
          },
        },
        balance,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  /** Instant PvP: both cars must be owned by different members. */
  router.post("/top-trumps/pvp", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const parsed = pvpPlaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid play request",
      });
      return;
    }
    const { listingId, opponentListingId, category } = parsed.data;

    const mine = await loadOwnedCard(listingId);
    const theirs = await loadOwnedCard(opponentListingId);
    if (!mine || Number(mine.owner_user_id) !== user.id) {
      res.status(403).json({ error: "forbidden", message: "Pick a car you own." });
      return;
    }
    if (!theirs || theirs.owner_user_id == null) {
      res.status(400).json({ error: "invalid_opponent", message: "Opponent card must be member-owned." });
      return;
    }
    if (Number(theirs.owner_user_id) === user.id) {
      res.status(400).json({ error: "same_owner", message: "Challenge someone else's car." });
      return;
    }

    const challengerValue = cardValue(mine, category);
    const opponentValue = cardValue(theirs, category);
    const winner = decideWinner(category, challengerValue, opponentValue);
    const challengerReward = rewardForResult(winner, "challenger");
    const opponentReward = rewardForResult(winner, "opponent");
    const opponentUserId = Number(theirs.owner_user_id);

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [insert] = await connection.query<ResultSetHeader>(
        `INSERT INTO top_trumps_matches
          (challenger_user_id, opponent_user_id, challenger_listing_id, opponent_listing_id,
           opponent_make, opponent_model, opponent_trim, category,
           challenger_value, opponent_value, winner, coin_reward, mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pvp')`,
        [
          user.id,
          opponentUserId,
          listingId,
          opponentListingId,
          theirs.make,
          theirs.model,
          theirs.trim_name,
          category,
          challengerValue,
          opponentValue,
          winner,
          challengerReward,
        ],
      );
      const balance = await applyCoinDelta(connection, {
        userId: user.id,
        delta: challengerReward,
        reason: "play_reward",
        listingId,
        note: `Top Trumps PvP (${category})`,
      });
      await applyCoinDelta(connection, {
        userId: opponentUserId,
        delta: opponentReward,
        reason: "play_reward",
        listingId: opponentListingId,
        note: `Top Trumps PvP (${category})`,
      });
      await connection.commit();
      res.status(201).json({
        match: {
          id: Number(insert.insertId),
          mode: "pvp",
          category,
          challengerValue,
          opponentValue,
          winner,
          coinReward: challengerReward,
          opponentCoinReward: opponentReward,
          opponent: {
            make: theirs.make,
            model: theirs.model,
            trimName: theirs.trim_name,
            userId: opponentUserId,
          },
        },
        balance,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  router.get("/trades", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT t.id, t.status, t.created_at AS createdAt, t.resolved_at AS resolvedAt,
              t.from_user_id AS fromUserId, t.to_user_id AS toUserId,
              t.offer_listing_id AS offerListingId, t.request_listing_id AS requestListingId,
              fu.display_name AS fromDisplayName, tu.display_name AS toDisplayName,
              ocm.make AS offerMake, ocm.model AS offerModel,
              rcm.make AS requestMake, rcm.model AS requestModel
       FROM card_trade_offers t
       INNER JOIN users fu ON fu.id = t.from_user_id
       INNER JOIN users tu ON tu.id = t.to_user_id
       INNER JOIN listings ol ON ol.id = t.offer_listing_id
       INNER JOIN car_models ocm ON ocm.id = ol.car_model_id
       INNER JOIN listings rl ON rl.id = t.request_listing_id
       INNER JOIN car_models rcm ON rcm.id = rl.car_model_id
       WHERE t.from_user_id = ? OR t.to_user_id = ?
       ORDER BY t.id DESC
       LIMIT 50`,
      [user.id, user.id],
    );
    res.json({ trades: rows });
  });

  router.post("/trades", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const parsed = tradeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid trade",
      });
      return;
    }
    const { offerListingId, requestListingId } = parsed.data;
    if (offerListingId === requestListingId) {
      res.status(400).json({ error: "same_card", message: "Offer and request must be different cars." });
      return;
    }

    const offer = await loadOwnedCard(offerListingId);
    const requestCard = await loadOwnedCard(requestListingId);
    if (!offer || Number(offer.owner_user_id) !== user.id) {
      res.status(403).json({ error: "forbidden", message: "You must own the card you offer." });
      return;
    }
    if (!requestCard || requestCard.owner_user_id == null) {
      res.status(400).json({ error: "invalid_request", message: "Requested card must be member-owned." });
      return;
    }
    if (Number(requestCard.owner_user_id) === user.id) {
      res.status(400).json({ error: "same_owner", message: "Request a card from another member." });
      return;
    }

    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO card_trade_offers
        (from_user_id, to_user_id, offer_listing_id, request_listing_id, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [user.id, Number(requestCard.owner_user_id), offerListingId, requestListingId],
    );
    res.status(201).json({
      trade: {
        id: Number(result.insertId),
        status: "pending",
        offerListingId,
        requestListingId,
        toUserId: Number(requestCard.owner_user_id),
      },
    });
  });

  router.post("/trades/:id/accept", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const tradeId = Number(req.params.id);
    if (!Number.isFinite(tradeId) || tradeId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid trade id" });
      return;
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<
        (RowDataPacket & {
          id: number;
          from_user_id: number;
          to_user_id: number;
          offer_listing_id: number;
          request_listing_id: number;
          status: string;
        })[]
      >(`SELECT * FROM card_trade_offers WHERE id = ? FOR UPDATE`, [tradeId]);
      const trade = rows[0];
      if (!trade) {
        await connection.rollback();
        res.status(404).json({ error: "not_found", message: "Trade not found." });
        return;
      }
      if (trade.status !== "pending") {
        await connection.rollback();
        res.status(409).json({ error: "not_pending", message: "Trade is no longer pending." });
        return;
      }
      if (Number(trade.to_user_id) !== user.id) {
        await connection.rollback();
        res.status(403).json({ error: "forbidden", message: "Only the recipient can accept." });
        return;
      }

      const [offerRows] = await connection.query<(RowDataPacket & { owner_user_id: number | null })[]>(
        `SELECT owner_user_id FROM listings WHERE id = ? FOR UPDATE`,
        [trade.offer_listing_id],
      );
      const [requestRows] = await connection.query<(RowDataPacket & { owner_user_id: number | null })[]>(
        `SELECT owner_user_id FROM listings WHERE id = ? FOR UPDATE`,
        [trade.request_listing_id],
      );
      if (
        Number(offerRows[0]?.owner_user_id) !== Number(trade.from_user_id) ||
        Number(requestRows[0]?.owner_user_id) !== Number(trade.to_user_id)
      ) {
        await connection.query(
          `UPDATE card_trade_offers SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [tradeId],
        );
        await connection.commit();
        res.status(409).json({
          error: "ownership_changed",
          message: "One of the cars changed hands. Trade cancelled.",
        });
        return;
      }

      const [fromUser] = await connection.query<(RowDataPacket & { display_name: string })[]>(
        `SELECT display_name FROM users WHERE id = ?`,
        [trade.from_user_id],
      );
      const [toUser] = await connection.query<(RowDataPacket & { display_name: string })[]>(
        `SELECT display_name FROM users WHERE id = ?`,
        [trade.to_user_id],
      );

      // Free swap — no Brad Coins.
      await connection.query(
        `UPDATE listings SET owner_user_id = ?, owner_label = ?, status = 'owned' WHERE id = ?`,
        [trade.to_user_id, toUser[0]?.display_name ?? "Member", trade.offer_listing_id],
      );
      await connection.query(
        `UPDATE listings SET owner_user_id = ?, owner_label = ?, status = 'owned' WHERE id = ?`,
        [trade.from_user_id, fromUser[0]?.display_name ?? "Member", trade.request_listing_id],
      );
      await connection.query(
        `UPDATE card_trade_offers SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [tradeId],
      );
      await connection.commit();
      res.json({ ok: true, tradeId, status: "accepted" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  router.post("/trades/:id/decline", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const tradeId = Number(req.params.id);
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE card_trade_offers
       SET status = 'declined', resolved_at = CURRENT_TIMESTAMP
       WHERE id = ? AND to_user_id = ? AND status = 'pending'`,
      [tradeId, user.id],
    );
    if (!result.affectedRows) {
      res.status(409).json({ error: "not_declinable", message: "Trade cannot be declined." });
      return;
    }
    res.json({ ok: true, tradeId, status: "declined" });
  });

  router.post("/trades/:id/cancel", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const tradeId = Number(req.params.id);
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE card_trade_offers
       SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP
       WHERE id = ? AND from_user_id = ? AND status = 'pending'`,
      [tradeId, user.id],
    );
    if (!result.affectedRows) {
      res.status(409).json({ error: "not_cancellable", message: "Trade cannot be cancelled." });
      return;
    }
    res.json({ ok: true, tradeId, status: "cancelled" });
  });

  /** Member-owned cars available to challenge or request in a trade (excluding yours). */
  router.get("/cards/members", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT l.id, l.owner_user_id AS ownerUserId, u.display_name AS ownerDisplayName,
              cm.make, cm.model, cm.trim_name AS trimName,
              cm.bhp, cm.top_speed_mph AS topSpeedMph, cm.zero_to_sixty_secs AS zeroToSixtySecs,
              l.year, l.colour
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       INNER JOIN users u ON u.id = l.owner_user_id
       WHERE l.owner_user_id IS NOT NULL AND l.owner_user_id <> ?
       ORDER BY u.display_name, cm.make, cm.model
       LIMIT 100`,
      [user.id],
    );
    res.json({ cards: rows });
  });

  return router;
}
