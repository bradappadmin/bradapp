import type { NextFunction, Request, Response } from "express";
import { isAdminRole } from "./roles.js";
import { readSessionUser, type PublicUser } from "./session.js";

export type AuthedRequest = Request & { user: PublicUser };

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await readSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "unauthenticated", message: "Not signed in." });
    return;
  }
  (req as AuthedRequest).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await readSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "unauthenticated", message: "Not signed in." });
    return;
  }
  if (!isAdminRole(user.role)) {
    res.status(403).json({ error: "forbidden", message: "Admin area only." });
    return;
  }
  (req as AuthedRequest).user = user;
  next();
}
