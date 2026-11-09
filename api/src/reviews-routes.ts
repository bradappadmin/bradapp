import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { Router, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "./auth-middleware.js";
import { buildCueCards, buildDragRaceCueCards, type CarCueSource } from "./cue-cards.js";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { pinFeaturedReview, unpinFeaturedReview } from "./review-featured.js";
import {
  addReviewLike,
  countReviewLikes,
  getPublishedReviewId,
  removeReviewLike,
} from "./review-likes.js";
import { isAdminRole } from "./roles.js";
import { readSessionUser } from "./session.js";
import { ensureVideosDir, videoFilePath } from "./video-storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

const reviewTypeSchema = z.enum(["review", "drag_race"]);

const publishFields = z
  .object({
    type: reviewTypeSchema.default("review"),
    carModelId: z.coerce.number().int().positive(),
    carModelBId: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1).max(200),
  })
  .superRefine((value, ctx) => {
    if (value.type === "drag_race") {
      if (value.carModelBId == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Drag race needs car A and car B.",
          path: ["carModelBId"],
        });
        return;
      }
      if (value.carModelBId === value.carModelId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick two different cars for a drag race.",
          path: ["carModelBId"],
        });
      }
      return;
    }
    if (value.carModelBId != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single-car reviews do not take a second car.",
        path: ["carModelBId"],
      });
    }
  });

function requireReviewAdmin(req: AuthedRequest, res: Response): boolean {
  if (!isAdminRole(req.user.role)) {
    res.status(403).json({ error: "forbidden", message: "Only Brad or Napwood can do that." });
    return false;
  }
  return true;
}

type ReviewType = "review" | "drag_race";

type ReviewRow = RowDataPacket & {
  id: number;
  title: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  status: "published" | "unpublished";
  review_type: ReviewType;
  cue_cards_json: string | CueCardJson;
  created_at: Date;
  publisher_user_id: number;
  display_name: string;
  car_model_id: number;
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
  car_model_b_id: number | null;
  b_make: string | null;
  b_model: string | null;
  b_trim_name: string | null;
  b_body_type: string | null;
  b_bhp: number | null;
  b_top_speed_mph: number | null;
  b_zero_to_sixty_secs: number | null;
  like_count: number;
  liked_by_me: number | boolean;
  is_featured: number | boolean;
};

/** Reviews are on car models (no listing paint) — Midnight Black keeps studio photos on-brand. */
const REVIEW_STUDIO_COLOUR = "Midnight Black";

type CueCardJson = Array<{ id: string; title: string; prompt: string }>;

type CarModelCueRow = RowDataPacket & {
  id: number;
  make: string;
  model: string;
  trim_name: string;
  body_type: string;
  fuel: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
};

function parseCues(raw: string | CueCardJson): CueCardJson {
  if (typeof raw === "string") {
    return JSON.parse(raw) as CueCardJson;
  }
  return raw;
}

function toCarPayload(input: {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
}) {
  return {
    id: input.id,
    make: input.make,
    model: input.model,
    trimName: input.trimName,
    bodyType: input.bodyType,
    colour: REVIEW_STUDIO_COLOUR,
    bhp: input.bhp,
    topSpeedMph: input.topSpeedMph,
    zeroToSixtySecs: input.zeroToSixtySecs,
  };
}

function toCueSource(row: CarModelCueRow): CarCueSource {
  return {
    make: row.make,
    model: row.model,
    trimName: row.trim_name,
    bodyType: row.body_type,
    fuel: row.fuel,
    bhp: Number(row.bhp),
    topSpeedMph: Number(row.top_speed_mph),
    zeroToSixtySecs: Number(row.zero_to_sixty_secs),
  };
}

function toReview(row: ReviewRow) {
  const type: ReviewType = row.review_type === "drag_race" ? "drag_race" : "review";
  const car = toCarPayload({
    id: Number(row.car_model_id),
    make: row.make,
    model: row.model,
    trimName: row.trim_name,
    bodyType: row.body_type,
    bhp: Number(row.bhp),
    topSpeedMph: Number(row.top_speed_mph),
    zeroToSixtySecs: Number(row.zero_to_sixty_secs),
  });
  const carB =
    type === "drag_race" && row.car_model_b_id != null && row.b_make && row.b_model
      ? toCarPayload({
          id: Number(row.car_model_b_id),
          make: row.b_make,
          model: row.b_model,
          trimName: row.b_trim_name ?? "",
          bodyType: row.b_body_type ?? "",
          bhp: Number(row.b_bhp ?? 0),
          topSpeedMph: Number(row.b_top_speed_mph ?? 0),
          zeroToSixtySecs: Number(row.b_zero_to_sixty_secs ?? 0),
        })
      : null;
  return {
    id: Number(row.id),
    type,
    title: row.title,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    publisher: {
      id: Number(row.publisher_user_id),
      displayName: row.display_name,
    },
    car,
    carB,
    cueCards: parseCues(row.cue_cards_json),
    videoUrl: `/reviews/${row.id}/video`,
    byteSize: Number(row.byte_size),
    mimeType: row.mime_type,
    likeCount: Number(row.like_count ?? 0),
    likedByMe: Boolean(row.liked_by_me),
    featured: Boolean(row.is_featured),
  };
}

function reviewSelectSql(viewerUserId: number | null): string {
  const likedExpr =
    viewerUserId == null
      ? "0 AS liked_by_me"
      : `EXISTS (
           SELECT 1 FROM review_likes rlme
           WHERE rlme.review_id = r.id AND rlme.user_id = ${Number(viewerUserId)}
         ) AS liked_by_me`;
  return `
  SELECT r.id, r.title, r.filename, r.mime_type, r.byte_size, r.status, r.review_type, r.cue_cards_json, r.created_at,
         r.is_featured, r.publisher_user_id, u.display_name,
         cm.id AS car_model_id, cm.make, cm.model, cm.trim_name, cm.body_type,
         cm.bhp, cm.top_speed_mph, cm.zero_to_sixty_secs,
         cmb.id AS car_model_b_id, cmb.make AS b_make, cmb.model AS b_model, cmb.trim_name AS b_trim_name,
         cmb.body_type AS b_body_type, cmb.bhp AS b_bhp, cmb.top_speed_mph AS b_top_speed_mph,
         cmb.zero_to_sixty_secs AS b_zero_to_sixty_secs,
         (SELECT COUNT(*) FROM review_likes rlc WHERE rlc.review_id = r.id) AS like_count,
         ${likedExpr}
  FROM video_reviews r
  INNER JOIN users u ON u.id = r.publisher_user_id
  INNER JOIN car_models cm ON cm.id = r.car_model_id
  LEFT JOIN car_models cmb ON cmb.id = r.car_model_b_id
`;
}

async function loadCarModel(carModelId: number): Promise<CarModelCueRow | null> {
  const pool = getPool();
  const [rows] = await pool.query<CarModelCueRow[]>(
    `SELECT id, make, model, trim_name, body_type, fuel, bhp, top_speed_mph, zero_to_sixty_secs
     FROM car_models WHERE id = ? LIMIT 1`,
    [carModelId],
  );
  return rows[0] ?? null;
}

export function createReviewsRouter(): Router {
  const router = Router();

  router.get("/models", requireAuth, async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<
      (RowDataPacket & {
        id: number;
        make: string;
        model: string;
        trim_name: string;
        body_type: string;
      })[]
    >(
      `SELECT id, make, model, trim_name, body_type FROM car_models ORDER BY make, model, trim_name`,
    );
    res.json({
      models: rows.map((r) => ({
        id: Number(r.id),
        make: r.make,
        model: r.model,
        trimName: r.trim_name,
        bodyType: r.body_type,
        colour: REVIEW_STUDIO_COLOUR,
        label: `${r.make} ${r.model}${r.trim_name ? ` ${r.trim_name}` : ""}`,
      })),
    });
  });

  router.get("/cues/:carModelId", requireAuth, async (req, res: Response) => {
    const carModelId = Number(req.params.carModelId);
    if (!Number.isFinite(carModelId) || carModelId <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid car model" });
      return;
    }
    const vsRaw = req.query.vs;
    const carModelBId =
      vsRaw == null || vsRaw === ""
        ? null
        : Number(Array.isArray(vsRaw) ? vsRaw[0] : vsRaw);
    if (carModelBId != null && (!Number.isFinite(carModelBId) || carModelBId <= 0)) {
      res.status(400).json({ error: "validation_error", message: "Invalid second car model" });
      return;
    }
    if (carModelBId != null && carModelBId === carModelId) {
      res.status(400).json({
        error: "validation_error",
        message: "Pick two different cars for a drag race.",
      });
      return;
    }

    const car = await loadCarModel(carModelId);
    if (!car) {
      res.status(404).json({ error: "not_found", message: "Car model not found." });
      return;
    }

    if (carModelBId == null) {
      res.json({
        type: "review" as const,
        car: {
          id: carModelId,
          make: car.make,
          model: car.model,
          trimName: car.trim_name,
        },
        carB: null,
        cueCards: buildCueCards(toCueSource(car)),
      });
      return;
    }

    const carB = await loadCarModel(carModelBId);
    if (!carB) {
      res.status(404).json({ error: "not_found", message: "Second car model not found." });
      return;
    }
    res.json({
      type: "drag_race" as const,
      car: {
        id: carModelId,
        make: car.make,
        model: car.model,
        trimName: car.trim_name,
      },
      carB: {
        id: carModelBId,
        make: carB.make,
        model: carB.model,
        trimName: carB.trim_name,
      },
      cueCards: buildDragRaceCueCards(toCueSource(car), toCueSource(carB)),
    });
  });

  /** Published reviews are public (home / bay). `?all=1` needs an admin session. */
  router.get("/", async (req, res: Response) => {
    const wantAll = req.query.all === "1";
    const user = await readSessionUser(req);
    if (wantAll) {
      if (!user) {
        res.status(401).json({ error: "unauthenticated", message: "Not signed in." });
        return;
      }
      if (!isAdminRole(user.role)) {
        res.status(403).json({ error: "forbidden", message: "Admin area only." });
        return;
      }
    }
    const includeUnpublished = wantAll && user != null && isAdminRole(user.role);
    const rawLimit = Number(req.query.limit ?? (includeUnpublished ? 100 : 20));
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
      : includeUnpublished
        ? 100
        : 20;
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelectSql(user?.id ?? null)}
       ${includeUnpublished ? "" : "WHERE r.status = 'published'"}
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [limit],
    );
    res.json({ reviews: rows.map(toReview) });
  });

  /** Public: the single pinned published review for home, if any. */
  router.get("/featured", async (req, res: Response) => {
    const user = await readSessionUser(req);
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelectSql(user?.id ?? null)}
       WHERE r.status = 'published' AND r.is_featured = 1
       LIMIT 1`,
    );
    res.json({ review: rows[0] ? toReview(rows[0]) : null });
  });

  router.get("/:id", requireAuth, async (req, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelectSql(user.id)} WHERE r.id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "not_found", message: "Review not found." });
      return;
    }
    if (row.status !== "published" && !isAdminRole(user.role)) {
      res.status(404).json({ error: "not_found", message: "Review not found." });
      return;
    }
    res.json({ review: toReview(row) });
  });

  router.post("/:id/like", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    if ((await getPublishedReviewId(id)) == null) {
      res.status(404).json({ error: "not_found", message: "Published review not found." });
      return;
    }
    await addReviewLike(user.id, id);
    const likeCount = await countReviewLikes(id);
    res.json({ ok: true, liked: true, likeCount });
  });

  router.delete("/:id/like", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    if ((await getPublishedReviewId(id)) == null) {
      res.status(404).json({ error: "not_found", message: "Published review not found." });
      return;
    }
    await removeReviewLike(user.id, id);
    const likeCount = await countReviewLikes(id);
    res.json({ ok: true, liked: false, likeCount });
  });

  router.post("/:id/feature", requireAuth, async (req, res: Response) => {
    const authed = req as AuthedRequest;
    if (!requireReviewAdmin(authed, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    const result = await pinFeaturedReview(id);
    if (result === "not_found") {
      res.status(404).json({ error: "not_found", message: "Published review not found." });
      return;
    }
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelectSql(authed.user.id)} WHERE r.id = ? LIMIT 1`,
      [id],
    );
    res.json({ ok: true, review: toReview(rows[0]!) });
  });

  router.delete("/:id/feature", requireAuth, async (req, res: Response) => {
    const authed = req as AuthedRequest;
    if (!requireReviewAdmin(authed, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    const result = await unpinFeaturedReview(id);
    if (result === "not_featured") {
      res.status(409).json({ error: "not_featured", message: "Review is not featured." });
      return;
    }
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelectSql(authed.user.id)} WHERE r.id = ? LIMIT 1`,
      [id],
    );
    res.json({ ok: true, review: rows[0] ? toReview(rows[0]) : null });
  });

  router.get("/:id/video", requireAuth, async (req, res: Response) => {
    const id = Number(req.params.id);
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { filename: string; mime_type: string; status: string })[]>(
      `SELECT filename, mime_type, status FROM video_reviews WHERE id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "not_found", message: "Video not found." });
      return;
    }
    if (row.status !== "published" && !isAdminRole(user.role)) {
      res.status(404).json({ error: "not_found", message: "Video not found." });
      return;
    }
    try {
      const filePath = videoFilePath(row.filename);
      res.setHeader("Content-Type", row.mime_type);
      res.setHeader("Content-Disposition", `inline; filename="${row.filename}"`);
      createReadStream(filePath).on("error", () => {
        if (!res.headersSent) {
          res.status(404).json({ error: "missing_file", message: "Video file missing on disk." });
        }
      }).pipe(res);
    } catch {
      res.status(404).json({ error: "missing_file", message: "Video file missing on disk." });
    }
  });

  router.post("/", requireAuth, upload.single("video"), async (req, res: Response) => {
    const authed = req as AuthedRequest;
    if (!requireReviewAdmin(authed, res)) return;

    const parsed = publishFields.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid review fields",
      });
      return;
    }
    const file = req.file;
    if (!file || !file.buffer?.length) {
      res.status(400).json({ error: "validation_error", message: "Video file is required." });
      return;
    }
    const mime = file.mimetype || "video/webm";
    if (!mime.startsWith("video/")) {
      res.status(400).json({ error: "validation_error", message: "File must be a video." });
      return;
    }

    const reviewType = parsed.data.type;
    const car = await loadCarModel(parsed.data.carModelId);
    if (!car) {
      res.status(404).json({ error: "not_found", message: "Car model not found." });
      return;
    }

    let carB: CarModelCueRow | null = null;
    if (reviewType === "drag_race") {
      carB = await loadCarModel(parsed.data.carModelBId!);
      if (!carB) {
        res.status(404).json({ error: "not_found", message: "Second car model not found." });
        return;
      }
    }

    const cueCards =
      reviewType === "drag_race" && carB
        ? buildDragRaceCueCards(toCueSource(car), toCueSource(carB))
        : buildCueCards(toCueSource(car));

    const ext = mime.includes("mp4") ? "mp4" : mime.includes("quicktime") ? "mov" : "webm";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    await ensureVideosDir();
    await writeFile(videoFilePath(filename), file.buffer);

    const pool = getPool();
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO video_reviews
          (publisher_user_id, car_model_id, review_type, car_model_b_id, title, filename, mime_type, byte_size, cue_cards_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), 'published')`,
        [
          authed.user.id,
          parsed.data.carModelId,
          reviewType,
          reviewType === "drag_race" ? parsed.data.carModelBId! : null,
          parsed.data.title,
          filename,
          mime,
          file.size,
          JSON.stringify(cueCards),
        ],
      );
      const [rows] = await pool.query<ReviewRow[]>(
        `${reviewSelectSql(authed.user.id)} WHERE r.id = ? LIMIT 1`,
        [result.insertId],
      );
      res.status(201).json({ review: toReview(rows[0]!) });
    } catch (error) {
      await unlink(videoFilePath(filename)).catch(() => undefined);
      throw error;
    }
  });

  router.post("/:id/unpublish", requireAuth, async (req, res: Response) => {
    const authed = req as AuthedRequest;
    if (!requireReviewAdmin(authed, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE video_reviews
       SET status = 'unpublished', is_featured = 0,
           unpublished_at = CURRENT_TIMESTAMP, unpublished_by_user_id = ?
       WHERE id = ? AND status = 'published'`,
      [authed.user.id, id],
    );
    if (!result.affectedRows) {
      res.status(409).json({ error: "not_published", message: "Review is not published." });
      return;
    }
    res.json({ ok: true, id, status: "unpublished" });
  });

  return router;
}
