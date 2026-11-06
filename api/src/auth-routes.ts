import { Router, type Request, type Response } from "express";
import { z } from "zod";
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
};

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: Number(row.id),
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}

function sendValidationError(res: Response, error: z.ZodError): void {
  res.status(400).json({
    error: "validation_error",
    message: error.issues[0]?.message ?? "Invalid request",
  });
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
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES (?, ?, ?, 'member')`,
      [email, passwordHash, displayName],
    );

    await createSession(res, Number(result.insertId));
    res.status(201).json({
      user: {
        id: Number(result.insertId),
        email,
        displayName,
        role: "member" as const,
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
      "SELECT id, email, password_hash, display_name, role FROM users WHERE email = ? LIMIT 1",
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

    await createSession(res, Number(user.id));
    res.json({ user: toPublicUser(user) });
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
