import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "./auth-middleware.js";
import { applyCoinDelta, getCoinBalance, listLedger } from "./coins.js";
import { getPool, type RowDataPacket } from "./db.js";
import { listSoldHistory } from "./sold-history.js";

const sellSchema = z.object({
  coinPrice: z.number().int().min(1).max(1_000_000),
});

type ListingTradeRow = RowDataPacket & {
  id: number;
  coin_price: number;
  status: "available" | "owned" | "sold";
  owner_user_id: number | null;
  owner_label: string;
};

export function createTradeRouter(): Router {
  const router = Router();

  router.get("/wallet", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const balance = await getCoinBalance(user.id);
    const ledger = await listLedger(user.id, 25);
    res.json({ balance, ledger });
  });

  router.get("/garage", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
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
         g.city AS garageCity
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       INNER JOIN garages g ON g.id = l.garage_id
       WHERE l.owner_user_id = ?
       ORDER BY l.updated_at DESC`,
      [user.id],
    );
    // Fair value = each listing's coin_price (asking price when listed, last price when owned).
    const cars = rows as Array<{ coinPrice: number }>;
    const totalValue = cars.reduce((sum, car) => sum + Number(car.coinPrice), 0);
    res.json({ cars: rows, totalValue });
  });

  router.get("/sold", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const sales = await listSoldHistory(user.id);
    res.json({ sales });
  });

  router.post("/listings/:id/buy", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<ListingTradeRow[]>(
        `SELECT id, coin_price, status, owner_user_id, owner_label
         FROM listings WHERE id = ? FOR UPDATE`,
        [listingId],
      );
      const listing = rows[0];
      if (!listing) {
        await connection.rollback();
        res.status(404).json({ error: "not_found", message: "Listing not found." });
        return;
      }
      if (listing.status !== "available") {
        await connection.rollback();
        res.status(409).json({ error: "not_for_sale", message: "This car is not for sale." });
        return;
      }
      if (listing.owner_user_id != null && Number(listing.owner_user_id) === user.id) {
        await connection.rollback();
        res.status(409).json({ error: "own_listing", message: "You already own this listing." });
        return;
      }

      const price = Number(listing.coin_price);
      const sellerId = listing.owner_user_id == null ? null : Number(listing.owner_user_id);

      let buyerBalance: number;
      try {
        buyerBalance = await applyCoinDelta(connection, {
          userId: user.id,
          delta: -price,
          reason: "purchase",
          listingId,
          note: `Bought listing #${listingId}`,
        });
      } catch (error) {
        await connection.rollback();
        if (error instanceof Error && error.message === "insufficient_coins") {
          res.status(400).json({
            error: "insufficient_coins",
            message: "Not enough Brad Coins for this purchase.",
          });
          return;
        }
        throw error;
      }

      if (sellerId != null) {
        await applyCoinDelta(connection, {
          userId: sellerId,
          delta: price,
          reason: "sale",
          listingId,
          note: `Sold listing #${listingId} to ${user.displayName}`,
        });
      }

      await connection.query(
        `UPDATE listings
         SET owner_user_id = ?, owner_label = ?, status = 'owned'
         WHERE id = ?`,
        [user.id, user.displayName, listingId],
      );

      await connection.commit();
      res.json({
        ok: true,
        listingId,
        coinPrice: price,
        balance: buyerBalance,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  router.post("/listings/:id/sell", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }
    const parsed = sellSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid price",
      });
      return;
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<ListingTradeRow[]>(
        `SELECT id, coin_price, status, owner_user_id, owner_label
         FROM listings WHERE id = ? FOR UPDATE`,
        [listingId],
      );
      const listing = rows[0];
      if (!listing) {
        await connection.rollback();
        res.status(404).json({ error: "not_found", message: "Listing not found." });
        return;
      }
      if (listing.owner_user_id == null || Number(listing.owner_user_id) !== user.id) {
        await connection.rollback();
        res.status(403).json({ error: "forbidden", message: "You do not own this car." });
        return;
      }
      if (listing.status === "sold") {
        await connection.rollback();
        res.status(409).json({ error: "not_sellable", message: "This listing cannot be sold." });
        return;
      }

      await connection.query(
        `UPDATE listings
         SET coin_price = ?, status = 'available', owner_label = ?
         WHERE id = ?`,
        [parsed.data.coinPrice, user.displayName, listingId],
      );
      await connection.commit();
      res.json({
        ok: true,
        listingId,
        coinPrice: parsed.data.coinPrice,
        status: "available" as const,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  router.post("/listings/:id/unlist", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }

    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE listings
       SET status = 'owned'
       WHERE id = ? AND owner_user_id = ? AND status = 'available'`,
      [listingId, user.id],
    );
    const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affected === 0) {
      res.status(409).json({
        error: "not_listed",
        message: "Nothing to unlist — you may not own this car or it is not listed.",
      });
      return;
    }
    res.json({ ok: true, listingId, status: "owned" as const });
  });

  return router;
}
