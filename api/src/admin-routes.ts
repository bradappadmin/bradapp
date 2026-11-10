import { Router, type Response } from "express";
import { z } from "zod";
import { getRequireInviteCode, setRequireInviteCode } from "./app-settings.js";
import { requireAdmin, type AuthedRequest } from "./auth-middleware.js";
import { applyCoinDelta, listAdminCoinAdjustments, listLedger } from "./coins.js";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import {
  createInviteCode,
  generateInviteCode,
  isValidInviteCodeFormat,
  listInviteCodes,
  normalizeInviteCode,
  revokeInviteCode,
} from "./invite-codes.js";
import { LISTING_PAINT_COLOURS } from "./listing-colours.js";
import { isAdminRole, isRole, type Role } from "./roles.js";

const accountStatusSchema = z.enum(["active", "closed", "frozen"]);
const listingPaintColourSchema = z.enum(LISTING_PAINT_COLOURS);

const userPatchSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["super_admin", "admin", "member"]).optional(),
  accountStatus: accountStatusSchema.optional(),
});

type AccountStatus = z.infer<typeof accountStatusSchema>;

/** Who may freeze/close/reopen whom. Parent may freeze Brad; Brad may not touch parent. */
function canChangeAccountStatus(
  actorRole: Role,
  targetRole: Role,
  nextStatus: AccountStatus,
): { ok: true } | { ok: false; message: string } {
  if (nextStatus === "active") {
    // Unfreeze / reopen: Brad may restore members; Napwood may restore anyone.
    if (actorRole === "super_admin") return { ok: true };
    if (actorRole === "admin" && targetRole === "member") return { ok: true };
    return { ok: false, message: "Brad can only unfreeze member accounts." };
  }

  // freeze or close
  if (actorRole === "super_admin") {
    return { ok: true };
  }
  if (actorRole === "admin") {
    if (targetRole === "super_admin") {
      return { ok: false, message: "Brad cannot freeze or close Napwood’s account." };
    }
    if (targetRole === "admin") {
      return { ok: false, message: "Brad cannot freeze or close other admin accounts." };
    }
    return { ok: true };
  }
  return { ok: false, message: "Not allowed." };
}

const coinAdjustSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, "delta must be non-zero"),
  note: z.string().trim().max(255).optional(),
});

const garagePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  tagline: z.string().trim().max(200).optional(),
});

const carModelPatchSchema = z.object({
  make: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(120).optional(),
  trimName: z.string().trim().max(120).optional(),
  bodyType: z.string().trim().min(1).max(40).optional(),
  fuel: z.string().trim().min(1).max(40).optional(),
  drivetrain: z.string().trim().min(1).max(40).optional(),
  doors: z.number().int().min(1).max(6).optional(),
  seats: z.number().int().min(1).max(9).optional(),
  bhp: z.number().int().min(1).max(5000).optional(),
  topSpeedMph: z.number().int().min(1).max(400).optional(),
  zeroToSixtySecs: z.number().min(0.5).max(60).optional(),
});

const listingPatchSchema = z.object({
  conditionType: z.enum(["new", "used"]).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  colour: listingPaintColourSchema.optional(),
  mileage: z.number().int().min(0).max(5_000_000).optional(),
  coinPrice: z.number().int().min(1).max(1_000_000).optional(),
  ownerLabel: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["available", "owned", "sold"]).optional(),
  garageId: z.number().int().positive().optional(),
});

function canAssignRole(actor: Role, nextRole: Role): boolean {
  // Brad (admin) may only set member. Napwood may set any role.
  if (actor === "super_admin") {
    return true;
  }
  if (actor === "admin") {
    return nextRole === "member";
  }
  return false;
}

export function createAdminRouter(): Router {
  const router = Router();
  router.use(requireAdmin);

  router.get("/users", async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & {
      id: number;
      email: string;
      display_name: string;
      role: Role;
      coin_balance: number;
      account_status: AccountStatus;
      created_at: Date;
    })[]>(
      `SELECT id, email, display_name, role, coin_balance, account_status, created_at
       FROM users
       ORDER BY created_at DESC`,
    );
    res.json({
      users: rows.map((r) => ({
        id: Number(r.id),
        email: r.email,
        displayName: r.display_name,
        role: r.role,
        coinBalance: Number(r.coin_balance),
        accountStatus: r.account_status,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  });

  router.patch("/users/:id", async (req, res: Response) => {
    const actor = (req as unknown as AuthedRequest).user;
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid user id" });
      return;
    }
    const parsed = userPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid user patch",
      });
      return;
    }
    if (
      parsed.data.displayName == null &&
      parsed.data.role == null &&
      parsed.data.accountStatus == null
    ) {
      res.status(400).json({ error: "validation_error", message: "No changes provided" });
      return;
    }

    const pool = getPool();
    const [existingRows] = await pool.query<(RowDataPacket & { id: number; role: Role })[]>(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "User not found." });
      return;
    }

    if (parsed.data.role != null) {
      if (!canAssignRole(actor.role, parsed.data.role)) {
        res.status(403).json({
          error: "forbidden",
          message: "Only Napwood can assign admin roles.",
        });
        return;
      }
      // Brad may only correct member accounts' roles (to member).
      if (actor.role === "admin" && isAdminRole(existing.role)) {
        res.status(403).json({
          error: "forbidden",
          message: "Brad cannot change Napwood or other admin accounts.",
        });
        return;
      }
    }

    if (parsed.data.accountStatus != null) {
      const allowed = canChangeAccountStatus(
        actor.role,
        existing.role,
        parsed.data.accountStatus,
      );
      if (!allowed.ok) {
        res.status(403).json({ error: "forbidden", message: allowed.message });
        return;
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    if (parsed.data.displayName != null) {
      fields.push("display_name = ?");
      values.push(parsed.data.displayName);
    }
    if (parsed.data.role != null && isRole(parsed.data.role)) {
      fields.push("role = ?");
      values.push(parsed.data.role);
    }
    if (parsed.data.accountStatus != null) {
      fields.push("account_status = ?");
      values.push(parsed.data.accountStatus);
    }
    values.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    if (
      parsed.data.accountStatus === "closed" ||
      parsed.data.accountStatus === "frozen"
    ) {
      await pool.query("DELETE FROM sessions WHERE user_id = ?", [userId]);
    }

    const [fresh] = await pool.query<(RowDataPacket & {
      id: number;
      email: string;
      display_name: string;
      role: Role;
      coin_balance: number;
      account_status: AccountStatus;
    })[]>("SELECT id, email, display_name, role, coin_balance, account_status FROM users WHERE id = ?", [
      userId,
    ]);
    const u = fresh[0]!;
    res.json({
      user: {
        id: Number(u.id),
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        coinBalance: Number(u.coin_balance),
        accountStatus: u.account_status,
      },
    });
  });

  router.get("/coin-adjustments", async (req, res: Response) => {
    const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
    const adjustments = await listAdminCoinAdjustments(limit);
    res.json({ adjustments });
  });

  router.post("/users/:id/coins", async (req, res: Response) => {
    const actor = (req as unknown as AuthedRequest).user;
    const userId = Number(req.params.id);
    const parsed = coinAdjustSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid coin adjustment",
      });
      return;
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<(RowDataPacket & { id: number })[]>(
        "SELECT id FROM users WHERE id = ? FOR UPDATE",
        [userId],
      );
      if (!rows[0]) {
        await connection.rollback();
        res.status(404).json({ error: "not_found", message: "User not found." });
        return;
      }
      let balance: number;
      try {
        balance = await applyCoinDelta(connection, {
          userId,
          delta: parsed.data.delta,
          reason: "admin_adjust",
          note: parsed.data.note ?? "Admin balance correction",
          createdByUserId: actor.id,
        });
      } catch (error) {
        await connection.rollback();
        if (error instanceof Error && error.message === "insufficient_coins") {
          res.status(400).json({
            error: "insufficient_coins",
            message: "Adjustment would make the balance negative.",
          });
          return;
        }
        throw error;
      }
      await connection.commit();
      const ledger = await listLedger(userId, 10);
      res.json({ balance, ledger });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  router.get("/garages", async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, name, city, tagline FROM garages ORDER BY name");
    res.json({ garages: rows });
  });

  router.patch("/garages/:id", async (req, res: Response) => {
    const id = Number(req.params.id);
    const parsed = garagePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid garage patch",
      });
      return;
    }
    const fields: string[] = [];
    const values: unknown[] = [];
    if (parsed.data.name != null) {
      fields.push("name = ?");
      values.push(parsed.data.name);
    }
    if (parsed.data.city != null) {
      fields.push("city = ?");
      values.push(parsed.data.city);
    }
    if (parsed.data.tagline != null) {
      fields.push("tagline = ?");
      values.push(parsed.data.tagline);
    }
    if (!fields.length) {
      res.status(400).json({ error: "validation_error", message: "No changes provided" });
      return;
    }
    values.push(id);
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE garages SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: "not_found", message: "Garage not found." });
      return;
    }
    const [rows] = await pool.query("SELECT id, name, city, tagline FROM garages WHERE id = ?", [id]);
    res.json({ garage: (rows as unknown[])[0] });
  });

  router.get("/car-models", async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, make, model, trim_name AS trimName, body_type AS bodyType, fuel, drivetrain,
              doors, seats, bhp, top_speed_mph AS topSpeedMph, zero_to_sixty_secs AS zeroToSixtySecs
       FROM car_models
       ORDER BY make, model`,
    );
    res.json({ models: rows });
  });

  router.patch("/car-models/:id", async (req, res: Response) => {
    const id = Number(req.params.id);
    const parsed = carModelPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid car model patch",
      });
      return;
    }
    const map: Array<[keyof typeof parsed.data, string]> = [
      ["make", "make"],
      ["model", "model"],
      ["trimName", "trim_name"],
      ["bodyType", "body_type"],
      ["fuel", "fuel"],
      ["drivetrain", "drivetrain"],
      ["doors", "doors"],
      ["seats", "seats"],
      ["bhp", "bhp"],
      ["topSpeedMph", "top_speed_mph"],
      ["zeroToSixtySecs", "zero_to_sixty_secs"],
    ];
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of map) {
      const value = parsed.data[key];
      if (value != null) {
        fields.push(`${column} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "validation_error", message: "No changes provided" });
      return;
    }
    values.push(id);
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE car_models SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: "not_found", message: "Car model not found." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT id, make, model, trim_name AS trimName, body_type AS bodyType, fuel, drivetrain,
              doors, seats, bhp, top_speed_mph AS topSpeedMph, zero_to_sixty_secs AS zeroToSixtySecs
       FROM car_models WHERE id = ?`,
      [id],
    );
    res.json({ model: (rows as unknown[])[0] });
  });

  router.get("/listings", async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT l.id, l.condition_type AS conditionType, l.year, l.colour, l.mileage,
              l.coin_price AS coinPrice, l.owner_label AS ownerLabel, l.status, l.garage_id AS garageId,
              cm.make, cm.model, cm.trim_name AS trimName, g.name AS garageName
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       INNER JOIN garages g ON g.id = l.garage_id
       ORDER BY l.id DESC
       LIMIT 200`,
    );
    res.json({ listings: rows });
  });

  router.patch("/listings/:id", async (req, res: Response) => {
    const id = Number(req.params.id);
    const parsed = listingPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid listing patch",
      });
      return;
    }
    const map: Array<[keyof typeof parsed.data, string]> = [
      ["conditionType", "condition_type"],
      ["year", "year"],
      ["colour", "colour"],
      ["mileage", "mileage"],
      ["coinPrice", "coin_price"],
      ["ownerLabel", "owner_label"],
      ["status", "status"],
      ["garageId", "garage_id"],
    ];
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of map) {
      const value = parsed.data[key];
      if (value != null) {
        fields.push(`${column} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "validation_error", message: "No changes provided" });
      return;
    }
    values.push(id);
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE listings SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: "not_found", message: "Listing not found." });
      return;
    }
    const [rows] = await pool.query(
      `SELECT l.id, l.condition_type AS conditionType, l.year, l.colour, l.mileage,
              l.coin_price AS coinPrice, l.owner_label AS ownerLabel, l.status, l.garage_id AS garageId,
              cm.make, cm.model, cm.trim_name AS trimName, g.name AS garageName
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       INNER JOIN garages g ON g.id = l.garage_id
       WHERE l.id = ?`,
      [id],
    );
    res.json({ listing: (rows as unknown[])[0] });
  });

  const createInviteSchema = z.object({
    code: z
      .string()
      .trim()
      .max(64)
      .optional()
      .transform((v) => (v && v.length > 0 ? normalizeInviteCode(v) : undefined)),
    maxUses: z.number().int().positive().max(10_000).nullable().optional(),
    expiresAt: z.string().trim().max(64).nullable().optional(),
  });

  router.get("/invites", async (_req, res: Response) => {
    const [invites, requireInviteCode] = await Promise.all([
      listInviteCodes(),
      getRequireInviteCode(),
    ]);
    res.json({ invites, requireInviteCode });
  });

  const requireInviteSchema = z.object({
    requireInviteCode: z.boolean(),
  });

  /** Toggle: when true, signup requires a valid family invite code. */
  router.put("/invites/require", async (req, res: Response) => {
    const parsed = requireInviteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: "requireInviteCode must be a boolean.",
      });
      return;
    }
    const requireInviteCode = await setRequireInviteCode(parsed.data.requireInviteCode);
    res.json({ requireInviteCode });
  });

  router.post("/invites", async (req, res: Response) => {
    const parsed = createInviteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid invite",
      });
      return;
    }
    const actor = (req as AuthedRequest).user;
    const code = parsed.data.code ?? generateInviteCode();
    if (!isValidInviteCodeFormat(code)) {
      res.status(400).json({
        error: "validation_error",
        message: "Invite codes use letters, numbers, dashes, or underscores (3–64 chars).",
      });
      return;
    }
    let expiresAt: Date | null = null;
    const rawExpiry = parsed.data.expiresAt;
    if (rawExpiry) {
      expiresAt = new Date(rawExpiry);
      if (Number.isNaN(expiresAt.getTime())) {
        res.status(400).json({ error: "validation_error", message: "Invalid expiry date." });
        return;
      }
    }
    try {
      const invite = await createInviteCode({
        createdByUserId: actor.id,
        code,
        maxUses: parsed.data.maxUses ?? null,
        expiresAt,
      });
      res.status(201).json({ invite });
    } catch (error) {
      if (error instanceof Error && error.message === "code_taken") {
        res.status(409).json({
          error: "code_taken",
          message: "That invite code already exists.",
        });
        return;
      }
      throw error;
    }
  });

  router.post("/invites/:id/revoke", async (req, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid invite id" });
      return;
    }
    const invite = await revokeInviteCode(id);
    if (!invite) {
      res.status(404).json({ error: "not_found", message: "Invite not found." });
      return;
    }
    res.json({ invite });
  });

  return router;
}
