import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import type { Role } from "./roles.js";

const SESSION_COOKIE = "bradapp_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type PublicUser = {
  id: number;
  email: string;
  displayName: string;
  /** Short public garage bio; null when unset. */
  bio: string | null;
  role: Role;
  coinBalance: number;
};

type SessionRow = RowDataPacket & {
  id: string;
  user_id: number;
  email: string;
  display_name: string;
  bio: string | null;
  role: Role;
  coin_balance: number;
  account_status: "active" | "closed" | "frozen";
  expires_at: Date;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters");
  }
  return secret;
}

function signToken(sessionId: string): string {
  const sig = createHmac("sha256", getSessionSecret()).update(sessionId).digest("base64url");
  return `${sessionId}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [sessionId, sig] = parts;
  if (!sessionId || !sig) {
    return null;
  }
  const expected = createHmac("sha256", getSessionSecret()).update(sessionId).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  return sessionId;
}

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export async function createSession(res: Response, userId: number): Promise<void> {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const pool = getPool();
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, userId, expiresAt],
  );
  res.cookie(SESSION_COOKIE, signToken(sessionId), cookieOptions(SESSION_TTL_MS));
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    const sessionId = verifyToken(token);
    if (sessionId) {
      await getPool().query("DELETE FROM sessions WHERE id = ?", [sessionId]);
    }
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function readSessionUser(req: Request): Promise<PublicUser | null> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) {
    return null;
  }
  const sessionId = verifyToken(token);
  if (!sessionId) {
    return null;
  }

  const pool = getPool();
  const [rows] = await pool.query<SessionRow[]>(
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.display_name, u.bio, u.role, u.coin_balance, u.account_status
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
     LIMIT 1`,
    [sessionId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await pool.query<ResultSetHeader>("DELETE FROM sessions WHERE id = ?", [sessionId]);
    return null;
  }

  if (row.account_status === "closed" || row.account_status === "frozen") {
    await pool.query<ResultSetHeader>("DELETE FROM sessions WHERE id = ?", [sessionId]);
    return null;
  }

  return {
    id: Number(row.user_id),
    email: row.email,
    displayName: row.display_name,
    bio: row.bio && row.bio.trim().length > 0 ? row.bio.trim() : null,
    role: row.role,
    coinBalance: Number(row.coin_balance),
  };
}

export { SESSION_COOKIE };
