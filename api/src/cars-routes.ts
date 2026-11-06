import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getPool, type RowDataPacket } from "./db.js";
import {
  buildSearchClause,
  listingSelectSql,
  toListingDetail,
  toListingSummary,
  type SearchParams,
} from "./cars.js";

const optionalInt = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expected a number" });
      return z.NEVER;
    }
    return Math.trunc(n);
  });

const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  make: z.string().trim().max(80).optional(),
  model: z.string().trim().max(120).optional(),
  bodyType: z.string().trim().max(40).optional(),
  fuel: z.string().trim().max(40).optional(),
  colour: z.string().trim().max(40).optional(),
  condition: z.enum(["new", "used"]).optional(),
  yearMin: optionalInt,
  yearMax: optionalInt,
  coinMin: optionalInt,
  coinMax: optionalInt,
  mileageMax: optionalInt,
  bhpMin: optionalInt,
  sort: z.enum(["price_asc", "price_desc", "year_desc", "mileage_asc", "bhp_desc"]).optional(),
  limit: optionalInt,
  offset: optionalInt,
});

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

export function createCarsRouter(): Router {
  const router = Router();

  router.get("/filters", async (_req: Request, res: Response) => {
    const pool = getPool();
    const [makes] = await pool.query<(RowDataPacket & { make: string })[]>(
      `SELECT DISTINCT cm.make FROM car_models cm
       INNER JOIN listings l ON l.car_model_id = cm.id AND l.status = 'available'
       ORDER BY cm.make`,
    );
    const [models] = await pool.query<(RowDataPacket & { model: string })[]>(
      `SELECT DISTINCT cm.model FROM car_models cm
       INNER JOIN listings l ON l.car_model_id = cm.id AND l.status = 'available'
       ORDER BY cm.model`,
    );
    const [bodyTypes] = await pool.query<(RowDataPacket & { body_type: string })[]>(
      `SELECT DISTINCT cm.body_type FROM car_models cm
       INNER JOIN listings l ON l.car_model_id = cm.id AND l.status = 'available'
       ORDER BY cm.body_type`,
    );
    const [fuels] = await pool.query<(RowDataPacket & { fuel: string })[]>(
      `SELECT DISTINCT cm.fuel FROM car_models cm
       INNER JOIN listings l ON l.car_model_id = cm.id AND l.status = 'available'
       ORDER BY cm.fuel`,
    );
    const [colours] = await pool.query<(RowDataPacket & { colour: string })[]>(
      `SELECT DISTINCT colour FROM listings WHERE status = 'available' ORDER BY colour`,
    );
    const [bounds] = await pool.query<
      (RowDataPacket & {
        yearMin: number;
        yearMax: number;
        coinPriceMin: number;
        coinPriceMax: number;
      })[]
    >(
      `SELECT
         MIN(year) AS yearMin,
         MAX(year) AS yearMax,
         MIN(coin_price) AS coinPriceMin,
         MAX(coin_price) AS coinPriceMax
       FROM listings WHERE status = 'available'`,
    );

    res.json({
      filters: {
        makes: makes.map((r) => r.make),
        models: models.map((r) => r.model),
        bodyTypes: bodyTypes.map((r) => r.body_type),
        fuels: fuels.map((r) => r.fuel),
        colours: colours.map((r) => r.colour),
        conditions: ["new", "used"] as const,
        yearMin: Number(bounds[0]?.yearMin ?? 0),
        yearMax: Number(bounds[0]?.yearMax ?? 0),
        coinPriceMin: Number(bounds[0]?.coinPriceMin ?? 0),
        coinPriceMax: Number(bounds[0]?.coinPriceMax ?? 0),
      },
    });
  });

  router.get("/search", async (req: Request, res: Response) => {
    const raw: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.query)) {
      raw[key] = emptyToUndefined(Array.isArray(value) ? value[0] : value);
    }
    const parsed = searchQuerySchema.safeParse(raw);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid search",
      });
      return;
    }

    const params = parsed.data as SearchParams;
    const limit = Math.min(Math.max(params.limit ?? 40, 1), 100);
    const offset = Math.max(params.offset ?? 0, 0);
    const { whereSql, values, orderSql } = buildSearchClause(params);
    const pool = getPool();

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       INNER JOIN garages g ON g.id = l.garage_id
       ${whereSql}`,
      values,
    );

    const [rows] = await pool.query(
      `${listingSelectSql()}
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );

    res.json({
      total: Number(countRows[0]?.total ?? 0),
      limit,
      offset,
      listings: (rows as Record<string, unknown>[]).map(toListingSummary),
    });
  });

  router.get("/listings/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }
    const pool = getPool();
    const [rows] = await pool.query(`${listingSelectSql()} WHERE l.id = ? LIMIT 1`, [id]);
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) {
      res.status(404).json({ error: "not_found", message: "Listing not found." });
      return;
    }
    res.json({ listing: toListingDetail(row) });
  });

  router.get("/models", async (req: Request, res: Response) => {
    const make = typeof req.query.make === "string" ? req.query.make.trim() : "";
    const pool = getPool();
    if (!make) {
      const [rows] = await pool.query<(RowDataPacket & { model: string })[]>(
        `SELECT DISTINCT model FROM car_models ORDER BY model`,
      );
      res.json({ models: rows.map((r) => r.model) });
      return;
    }
    const [rows] = await pool.query<(RowDataPacket & { model: string })[]>(
      `SELECT DISTINCT model FROM car_models WHERE make = ? ORDER BY model`,
      [make],
    );
    res.json({ models: rows.map((r) => r.model) });
  });

  return router;
}
