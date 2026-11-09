import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getPool, type RowDataPacket } from "./db.js";
import { isRole, roleLabel, type Role } from "./roles.js";
import { readShowcaseListingId, resolveShowcaseCar } from "./showcase.js";

const membersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});

type MemberListRow = RowDataPacket & {
  id: number;
  display_name: string;
  bio: string | null;
  role: string;
  coin_balance: number;
  car_count: number;
};

type MemberCardRow = RowDataPacket & {
  id: number;
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
  year: number;
  colour: string;
  status: string;
  coin_price: number;
};

function mapMember(row: MemberListRow) {
  const role: Role = isRole(row.role) ? row.role : "member";
  const bio = row.bio && row.bio.trim().length > 0 ? row.bio.trim() : null;
  return {
    id: Number(row.id),
    displayName: row.display_name,
    bio,
    role,
    roleLabel: roleLabel(role),
    coinBalance: Number(row.coin_balance),
    carCount: Number(row.car_count),
  };
}

function mapPublicCar(car: MemberCardRow) {
  return {
    id: Number(car.id),
    make: car.make,
    model: car.model,
    trimName: car.trim_name,
    bodyType: car.body_type,
    bhp: Number(car.bhp),
    topSpeedMph: Number(car.top_speed_mph),
    zeroToSixtySecs: Number(car.zero_to_sixty_secs),
    year: Number(car.year),
    colour: car.colour,
    status: car.status,
    coinPrice: Number(car.coin_price),
  };
}

/**
 * Public member directory + garage pages.
 * Returns display name, role label, Brad Coin balance, car count, and cars —
 * never email or password material.
 */
export function createMembersRouter(): Router {
  const router = Router();

  /**
   * Active members/admins with coin balance and owned-car count.
   * Optional `q` matches display name, or email local-part as a fallback name
   * (email itself is never returned).
   */
  router.get("/", async (req: Request, res: Response) => {
    const parsed = membersQuerySchema.safeParse({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", message: "Invalid search query" });
      return;
    }

    const q = parsed.data.q?.trim() ?? "";
    const pool = getPool();
    const values: Array<string | number> = [];
    let whereSql = `WHERE u.account_status = 'active'`;
    if (q.length > 0) {
      const like = `%${q}%`;
      whereSql += ` AND (
        u.display_name LIKE ?
        OR SUBSTRING_INDEX(u.email, '@', 1) LIKE ?
      )`;
      values.push(like, like);
    }

    const [rows] = await pool.query<MemberListRow[]>(
      `SELECT u.id, u.display_name, u.bio, u.role, u.coin_balance,
              COUNT(l.id) AS car_count
       FROM users u
       LEFT JOIN listings l
         ON l.owner_user_id = u.id AND l.status IN ('owned', 'available')
       ${whereSql}
       GROUP BY u.id, u.display_name, u.bio, u.role, u.coin_balance
       ORDER BY u.display_name ASC`,
      values,
    );
    res.json({ members: rows.map(mapMember), q: q || null });
  });

  router.get("/:id", async (req, res: Response) => {
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId) || memberId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid member id" });
      return;
    }

    const pool = getPool();
    const [rows] = await pool.query<MemberListRow[]>(
      `SELECT u.id, u.display_name, u.bio, u.role, u.coin_balance,
              COUNT(l.id) AS car_count
       FROM users u
       LEFT JOIN listings l
         ON l.owner_user_id = u.id AND l.status IN ('owned', 'available')
       WHERE u.id = ? AND u.account_status = 'active'
       GROUP BY u.id, u.display_name, u.bio, u.role, u.coin_balance
       LIMIT 1`,
      [memberId],
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "not_found", message: "Member not found." });
      return;
    }

    const [cars] = await pool.query<MemberCardRow[]>(
      `SELECT l.id, cm.make, cm.model, cm.trim_name, cm.body_type, cm.bhp, cm.top_speed_mph,
              cm.zero_to_sixty_secs, l.year, l.colour, l.status, l.coin_price
       FROM listings l
       INNER JOIN car_models cm ON cm.id = l.car_model_id
       WHERE l.owner_user_id = ? AND l.status IN ('owned', 'available')
       ORDER BY cm.make, cm.model, l.id`,
      [memberId],
    );

    const mappedCars = cars.map(mapPublicCar);
    const pinnedListingId = await readShowcaseListingId(pool, memberId);
    const resolved = resolveShowcaseCar(mappedCars, pinnedListingId);

    res.json({
      member: mapMember(row),
      cars: mappedCars,
      showcase: resolved?.car ?? null,
      showcaseSource: resolved?.source ?? null,
      showcaseListingId: pinnedListingId,
    });
  });

  return router;
}
