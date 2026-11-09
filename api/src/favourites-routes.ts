import { Router, type Response } from "express";
import { requireAuth, type AuthedRequest } from "./auth-middleware.js";
import {
  addFavourite,
  isListingFavourited,
  listFavourites,
  listingExists,
  removeFavourite,
} from "./favourites.js";

function parseListingId(raw: string): number | null {
  const listingId = Number(raw);
  if (!Number.isFinite(listingId) || listingId <= 0) return null;
  return listingId;
}

export function createFavouritesRouter(): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const cars = await listFavourites(user.id);
    res.json({ cars });
  });

  router.get("/:listingId", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = parseListingId(req.params.listingId);
    if (listingId == null) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }
    const favourited = await isListingFavourited(user.id, listingId);
    res.json({ favourited });
  });

  router.post("/:listingId", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = parseListingId(req.params.listingId);
    if (listingId == null) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }
    if (!(await listingExists(listingId))) {
      res.status(404).json({ error: "not_found", message: "Listing not found." });
      return;
    }
    await addFavourite(user.id, listingId);
    res.json({ ok: true, favourited: true });
  });

  router.delete("/:listingId", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const listingId = parseListingId(req.params.listingId);
    if (listingId == null) {
      res.status(400).json({ error: "validation_error", message: "Invalid listing id" });
      return;
    }
    await removeFavourite(user.id, listingId);
    res.json({ ok: true, favourited: false });
  });

  return router;
}
