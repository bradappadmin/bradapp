import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { applyCoinDelta } from "./coins.js";
import { closePool, getPool, type RowDataPacket } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

/** Give the user a bay-owned car without depending on depleted catalogue stock. */
async function assignOwnedListing(userId: number, displayName: string): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    `SELECT id FROM listings
     WHERE status IN ('owned', 'available')
     ORDER BY id ASC
     LIMIT 1`,
  );
  const listingId = Number(rows[0]?.id);
  expect(listingId).toBeGreaterThan(0);
  await pool.query(
    `UPDATE listings
     SET owner_user_id = ?, owner_label = ?, status = 'owned'
     WHERE id = ?`,
    [userId, displayName, listingId],
  );
  await pool.query(`UPDATE users SET showcase_listing_id = NULL WHERE showcase_listing_id = ?`, [
    listingId,
  ]);
  return listingId;
}

describe.runIf(hasDb)("garage showcase", () => {
  const app = createApp();
  const owner = request.agent(app);
  const email = `showcase-${Date.now()}@example.com`;
  let listingId = 0;
  let userId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await owner.post("/auth/signup").send({
      email,
      password: "ShowcasePass-123!",
      displayName: "Showcase Owner",
    });
    expect(signup.status).toBe(201);
    userId = Number(signup.body.user.id);
    listingId = await assignOwnedListing(userId, "Showcase Owner");
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("UPDATE users SET showcase_listing_id = NULL WHERE email = ?", [email]);
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("pins and unpins a showcase listing on the garage", async () => {
    const pin = await owner.put("/trade/garage/showcase").send({ listingId });
    expect(pin.status).toBe(200);
    expect(pin.body.showcaseListingId).toBe(listingId);

    const garage = await owner.get("/trade/garage");
    expect(garage.status).toBe(200);
    expect(garage.body.showcaseListingId).toBe(listingId);

    const profile = await request(app).get(`/members/${userId}`);
    expect(profile.status).toBe(200);
    expect(profile.body.showcaseListingId).toBe(listingId);
    expect(profile.body.showcaseSource).toBe("pinned");
    expect(profile.body.showcase.id).toBe(listingId);
    expect(profile.body.member).not.toHaveProperty("email");

    const unpin = await owner.put("/trade/garage/showcase").send({ listingId: null });
    expect(unpin.status).toBe(200);
    expect(unpin.body.showcaseListingId).toBeNull();

    const after = await request(app).get(`/members/${userId}`);
    expect(after.body.showcaseSource).toBe("highest_value");
    expect(after.body.showcase.id).toBe(listingId);
  });

  it("clears the pin when the showcase car is sold", async () => {
    expect((await owner.put("/trade/garage/showcase").send({ listingId })).status).toBe(200);
    expect(
      (await owner.post(`/trade/listings/${listingId}/sell`).send({ coinPrice: 40 })).status,
    ).toBe(200);

    const buyer = request.agent(app);
    const buyerEmail = `showcase-buyer-${Date.now()}@example.com`;
    const signup = await buyer.post("/auth/signup").send({
      email: buyerEmail,
      password: "ShowcasePass-123!",
      displayName: "Showcase Buyer",
    });
    expect(signup.status).toBe(201);
    const buyerId = Number(signup.body.user.id);
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await applyCoinDelta(connection, {
        userId: buyerId,
        delta: 200,
        reason: "admin_adjust",
        note: "Test top-up for showcase buyer",
      });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    expect((await buyer.post(`/trade/listings/${listingId}/buy`)).status).toBe(200);

    const garage = await owner.get("/trade/garage");
    expect(garage.status).toBe(200);
    expect(garage.body.showcaseListingId).toBeNull();
    expect(garage.body.cars.find((c: { id: number }) => c.id === listingId)).toBeFalsy();

    await pool.query("UPDATE users SET showcase_listing_id = NULL WHERE email = ?", [buyerEmail]);
    await pool.query("DELETE FROM users WHERE email = ?", [buyerEmail]);
  });

  it("rejects pinning a car you do not own", async () => {
    const [rows] = await getPool().query<(RowDataPacket & { id: number })[]>(
      `SELECT id FROM listings
       WHERE id <> ? AND (owner_user_id IS NULL OR owner_user_id <> ?)
       ORDER BY id DESC
       LIMIT 1`,
      [listingId, userId],
    );
    const foreignId = Number(rows[0]?.id);
    expect(foreignId).toBeGreaterThan(0);
    const res = await owner.put("/trade/garage/showcase").send({ listingId: foreignId });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not_owner");
  });
});
