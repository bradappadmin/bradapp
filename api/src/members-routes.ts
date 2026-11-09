import { Router, type Response } from "express";
import { getPool, type RowDataPacket } from "./db.js";
import { isRole, roleLabel, type Role } from "./roles.js";

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

  /** Active members/admins with coin balance and owned-car count. */
  router.get("/", async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<MemberListRow[]>(
      `SELECT u.id, u.display_name, u.bio, u.role, u.coin_balance,
              COUNT(l.id) AS car_count
       FROM users u
       LEFT JOIN listings l
         ON l.owner_user_id = u.id AND l.status IN ('owned', 'available')
       WHERE u.account_status = 'active'
       GROUP BY u.id, u.display_name, u.bio, u.role, u.coin_balance
       ORDER BY u.display_name ASC`,
    );
    res.json({ members: rows.map(mapMember) });
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

    res.json({
      member: mapMember(row),
      cars: cars.map(mapPublicCar),
    });
  });

  return router;
}
