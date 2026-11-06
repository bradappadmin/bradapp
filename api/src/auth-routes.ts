import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  ADMIN_STARTING_COINS,
  MEMBER_STARTING_COINS,
  applyCoinDelta,
  creditSeedIfNeeded,
} from "./coins.js";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSession, destroySession, readSessionUser, type PublicUser } from "./session.js";

const emailSchema = z.string().trim().email().max(255).transform((v) => v.toLowerCase());

const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  role: PublicUser["role"];
  coin_balance: number;
  account_status: "active" | "closed";
};

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: Number(row.id),
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    coinBalance: Number(row.coin_balance),
  };
}

function sendValidationError(res: Response, error: z.ZodError): void {
  res.status(400).json({
    error: "validation_error",
    message: error.issues[0]?.message ?? "Invalid request",
  });
}

function startingCoinsForRole(role: PublicUser["role"]): number {
  switch (role) {
    case "member":
      return MEMBER_STARTING_COINS;
    case "admin":
    case "super_admin":
      return ADMIN_STARTING_COINS;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function createAuthRouter(): Router {
  const router = Router();

  router.post("/signup", async (req: Request, res: Response) => {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const { email, password, displayName } = parsed.data;
    const pool = getPool();
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "email_taken", message: "An account with that email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const connection = await pool.getConnection();
    let userId: number;
    let coinBalance: number;
    try {
      await connection.beginTransaction();
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO users (email, password_hash, display_name, role, coin_balance)
         VALUES (?, ?, ?, 'member', 0)`,
        [email, passwordHash, displayName],
      );
      userId = Number(result.insertId);
      coinBalance = await applyCoinDelta(connection, {
        userId,
        delta: MEMBER_STARTING_COINS,
        reason: "seed",
        note: "Starting Brad Coins",
      });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    await createSession(res, userId);
    res.status(201).json({
      user: {
        id: userId,
        email,
        displayName,
        role: "member" as const,
        coinBalance,
      },
    });
  });

  router.post("/signin", async (req: Request, res: Response) => {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const { email, password } = parsed.data;
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, email, password_hash, display_name, role, coin_balance, account_status FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: "invalid_credentials", message: "Email or password is incorrect." });
      return;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: "invalid_credentials", message: "Email or password is incorrect." });
      return;
    }

    if (user.account_status === "closed") {
      res.status(403).json({ error: "account_closed", message: "This account has been closed." });
      return;
    }

    await creditSeedIfNeeded(
      Number(user.id),
      startingCoinsForRole(user.role),
      "Starting Brad Coins",
    );

    const [freshRows] = await pool.query<UserRow[]>(
      "SELECT id, email, password_hash, display_name, role, coin_balance, account_status FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );

    await createSession(res, Number(user.id));
    res.json({ user: toPublicUser(freshRows[0] ?? user) });
  });

  router.post("/signout", async (req: Request, res: Response) => {
    await destroySession(req, res);
    res.json({ ok: true });
  });

  router.get("/me", async (req: Request, res: Response) => {
    const user = await readSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "unauthenticated", message: "Not signed in." });
      return;
    }
    res.json({ user });
  });

  return router;
}
