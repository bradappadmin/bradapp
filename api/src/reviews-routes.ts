import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { Router, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "./auth-middleware.js";
import { buildCueCards } from "./cue-cards.js";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { isAdminRole } from "./roles.js";
import { ensureVideosDir, videoFilePath } from "./video-storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

const publishFields = z.object({
  carModelId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(200),
});

function requireReviewAdmin(req: AuthedRequest, res: Response): boolean {
  if (!isAdminRole(req.user.role)) {
    res.status(403).json({ error: "forbidden", message: "Only Brad or Napwood can do that." });
    return false;
  }
  return true;
}

type ReviewRow = RowDataPacket & {
  id: number;
  title: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  status: "published" | "unpublished";
  cue_cards_json: string | CueCardJson;
  created_at: Date;
  publisher_user_id: number;
  display_name: string;
  car_model_id: number;
  make: string;
  model: string;
  trim_name: string;
  bhp: number;
  top_speed_mph: number;
  zero_to_sixty_secs: number;
};

type CueCardJson = Array<{ id: string; title: string; prompt: string }>;

function parseCues(raw: string | CueCardJson): CueCardJson {
  if (typeof raw === "string") {
    return JSON.parse(raw) as CueCardJson;
  }
  return raw;
}

function toReview(row: ReviewRow) {
  return {
    id: Number(row.id),
    title: row.title,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    publisher: {
      id: Number(row.publisher_user_id),
      displayName: row.display_name,
    },
    car: {
      id: Number(row.car_model_id),
      make: row.make,
      model: row.model,
      trimName: row.trim_name,
      bhp: Number(row.bhp),
      topSpeedMph: Number(row.top_speed_mph),
      zeroToSixtySecs: Number(row.zero_to_sixty_secs),
    },
    cueCards: parseCues(row.cue_cards_json),
    videoUrl: `/reviews/${row.id}/video`,
    byteSize: Number(row.byte_size),
    mimeType: row.mime_type,
  };
}

const reviewSelect = `
  SELECT r.id, r.title, r.filename, r.mime_type, r.byte_size, r.status, r.cue_cards_json, r.created_at,
         r.publisher_user_id, u.display_name,
         cm.id AS car_model_id, cm.make, cm.model, cm.trim_name, cm.bhp, cm.top_speed_mph, cm.zero_to_sixty_secs
  FROM video_reviews r
  INNER JOIN users u ON u.id = r.publisher_user_id
  INNER JOIN car_models cm ON cm.id = r.car_model_id
`;

export function createReviewsRouter(): Router {
  const router = Router();

  router.get("/models", requireAuth, async (_req, res: Response) => {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { id: number; make: string; model: string; trim_name: string })[]>(
      `SELECT id, make, model, trim_name FROM car_models ORDER BY make, model, trim_name`,
    );
    res.json({
      models: rows.map((r) => ({
        id: Number(r.id),
        make: r.make,
        model: r.model,
        trimName: r.trim_name,
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
    const pool = getPool();
    const [rows] = await pool.query<
      (RowDataPacket & {
        make: string;
        model: string;
        trim_name: string;
        body_type: string;
        fuel: string;
        bhp: number;
        top_speed_mph: number;
        zero_to_sixty_secs: number;
      })[]
    >(
      `SELECT make, model, trim_name, body_type, fuel, bhp, top_speed_mph, zero_to_sixty_secs
       FROM car_models WHERE id = ? LIMIT 1`,
      [carModelId],
    );
    const car = rows[0];
    if (!car) {
      res.status(404).json({ error: "not_found", message: "Car model not found." });
      return;
    }
    res.json({
      car: {
        id: carModelId,
        make: car.make,
        model: car.model,
        trimName: car.trim_name,
      },
      cueCards: buildCueCards({
        make: car.make,
        model: car.model,
        trimName: car.trim_name,
        bodyType: car.body_type,
        fuel: car.fuel,
        bhp: Number(car.bhp),
        topSpeedMph: Number(car.top_speed_mph),
        zeroToSixtySecs: Number(car.zero_to_sixty_secs),
      }),
    });
  });

  router.get("/", requireAuth, async (req, res: Response) => {
    const user = (req as AuthedRequest).user;
    const includeUnpublished = isAdminRole(user.role) && req.query.all === "1";
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(
      `${reviewSelect}
       ${includeUnpublished ? "" : "WHERE r.status = 'published'"}
       ORDER BY r.created_at DESC
       LIMIT 100`,
    );
    res.json({ reviews: rows.map(toReview) });
  });

  router.get("/:id", requireAuth, async (req, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "validation_error", message: "Invalid review id" });
      return;
    }
    const user = (req as AuthedRequest).user;
    const pool = getPool();
    const [rows] = await pool.query<ReviewRow[]>(`${reviewSelect} WHERE r.id = ? LIMIT 1`, [id]);
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

    const pool = getPool();
    const [cars] = await pool.query<
      (RowDataPacket & {
        make: string;
        model: string;
        trim_name: string;
        body_type: string;
        fuel: string;
        bhp: number;
        top_speed_mph: number;
        zero_to_sixty_secs: number;
      })[]
    >(
      `SELECT make, model, trim_name, body_type, fuel, bhp, top_speed_mph, zero_to_sixty_secs
       FROM car_models WHERE id = ? LIMIT 1`,
      [parsed.data.carModelId],
    );
    const car = cars[0];
    if (!car) {
      res.status(404).json({ error: "not_found", message: "Car model not found." });
      return;
    }

    const cueCards = buildCueCards({
      make: car.make,
      model: car.model,
      trimName: car.trim_name,
      bodyType: car.body_type,
      fuel: car.fuel,
      bhp: Number(car.bhp),
      topSpeedMph: Number(car.top_speed_mph),
      zeroToSixtySecs: Number(car.zero_to_sixty_secs),
    });

    const ext = mime.includes("mp4") ? "mp4" : mime.includes("quicktime") ? "mov" : "webm";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    await ensureVideosDir();
    await writeFile(videoFilePath(filename), file.buffer);

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO video_reviews
          (publisher_user_id, car_model_id, title, filename, mime_type, byte_size, cue_cards_json, status)
         VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), 'published')`,
        [
          authed.user.id,
          parsed.data.carModelId,
          parsed.data.title,
          filename,
          mime,
          file.size,
          JSON.stringify(cueCards),
        ],
      );
      const [rows] = await pool.query<ReviewRow[]>(`${reviewSelect} WHERE r.id = ? LIMIT 1`, [
        result.insertId,
      ]);
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
       SET status = 'unpublished', unpublished_at = CURRENT_TIMESTAMP, unpublished_by_user_id = ?
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
