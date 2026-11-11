import { Router, type Response } from "express";
import { requireAuth } from "./auth-middleware.js";
import { listFamilyActivity } from "./activity.js";

export function createActivityRouter(): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res: Response) => {
    const raw = typeof req.query.limit === "string" ? Number(req.query.limit) : 30;
    const limit = Number.isFinite(raw) ? raw : 30;
    const items = await listFamilyActivity(limit);
    res.json({ items });
  });

  return router;
}
