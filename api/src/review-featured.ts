import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";

export async function pinFeaturedReview(reviewId: number): Promise<"ok" | "not_found"> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<(RowDataPacket & { id: number; status: string })[]>(
      `SELECT id, status FROM video_reviews WHERE id = ? LIMIT 1 FOR UPDATE`,
      [reviewId],
    );
    const row = rows[0];
    if (!row || row.status !== "published") {
      await connection.rollback();
      return "not_found";
    }
    await connection.query(`UPDATE video_reviews SET is_featured = 0 WHERE is_featured = 1`);
    await connection.query(`UPDATE video_reviews SET is_featured = 1 WHERE id = ?`, [reviewId]);
    await connection.commit();
    return "ok";
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function unpinFeaturedReview(reviewId: number): Promise<"ok" | "not_featured"> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE video_reviews SET is_featured = 0 WHERE id = ? AND is_featured = 1`,
    [reviewId],
  );
  return result.affectedRows > 0 ? "ok" : "not_featured";
}

export async function clearFeaturedFlag(reviewId: number): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE video_reviews SET is_featured = 0 WHERE id = ? AND is_featured = 1`, [
    reviewId,
  ]);
}
