import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";

export async function countReviewLikes(reviewId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) AS count FROM review_likes WHERE review_id = ?`,
    [reviewId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function hasUserLikedReview(userId: number, reviewId: number): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM review_likes WHERE review_id = ? AND user_id = ? LIMIT 1`,
    [reviewId, userId],
  );
  return rows.length > 0;
}

export async function addReviewLike(userId: number, reviewId: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO review_likes (review_id, user_id) VALUES (?, ?)`,
    [reviewId, userId],
  );
  return result.affectedRows > 0;
}

export async function removeReviewLike(userId: number, reviewId: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM review_likes WHERE review_id = ? AND user_id = ?`,
    [reviewId, userId],
  );
  return result.affectedRows > 0;
}

export async function getPublishedReviewId(reviewId: number): Promise<number | null> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { id: number; status: string })[]>(
    `SELECT id, status FROM video_reviews WHERE id = ? LIMIT 1`,
    [reviewId],
  );
  const row = rows[0];
  if (!row || row.status !== "published") return null;
  return Number(row.id);
}
