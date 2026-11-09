import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { ensureUser, seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("reviews routes", () => {
  const app = createApp();
  const admin = request.agent(app);
  const member = request.agent(app);
  const adminEmail = `review-admin-${Date.now()}@example.com`;
  const memberEmail = `review-member-${Date.now()}@example.com`;
  let carModelId = 0;
  let reviewId = 0;

  beforeAll(async () => {
    await seedAccounts();
    await ensureUser(adminEmail, "AdminPass-123!", "Review Admin", "admin");
    expect(
      (
        await admin.post("/auth/signin").send({
          email: adminEmail,
          password: "AdminPass-123!",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await member.post("/auth/signup").send({
          email: memberEmail,
          password: "MemberPass-123!",
          displayName: "Review Watcher",
        })
      ).status,
    ).toBe(201);

    const models = await admin.get("/reviews/models");
    expect(models.status).toBe(200);
    carModelId = models.body.models[0].id;
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email IN (?, ?)", [adminEmail, memberEmail]);
    await closePool();
  });

  it("returns cue cards for a car model", async () => {
    const res = await admin.get(`/reviews/cues/${carModelId}`);
    expect(res.status).toBe(200);
    expect(res.body.cueCards.length).toBeGreaterThan(3);
    expect(res.body.cueCards[0].prompt.length).toBeGreaterThan(0);
  });

  it("lets an admin publish a video review to disk + DB", async () => {
    const res = await admin
      .post("/reviews")
      .field("carModelId", String(carModelId))
      .field("title", "Bay test drive")
      .attach("video", Buffer.from("fake-webm-bytes"), {
        filename: "clip.webm",
        contentType: "video/webm",
      });
    expect(res.status).toBe(201);
    expect(res.body.review.title).toBe("Bay test drive");
    expect(res.body.review.status).toBe("published");
    expect(res.body.review.videoUrl).toMatch(/\/reviews\/\d+\/video/);
    reviewId = res.body.review.id;
  });

  it("lists published reviews for members and streams the file", async () => {
    const list = await member.get("/reviews");
    expect(list.status).toBe(200);
    expect(list.body.reviews.some((r: { id: number }) => r.id === reviewId)).toBe(true);

    const publicList = await request(app).get("/reviews").query({ limit: 5 });
    expect(publicList.status).toBe(200);
    expect(publicList.body.reviews.some((r: { id: number }) => r.id === reviewId)).toBe(true);
    expect(publicList.body.reviews.length).toBeLessThanOrEqual(5);

    const video = await member.get(`/reviews/${reviewId}/video`);
    expect(video.status).toBe(200);
    expect(video.headers["content-type"]).toMatch(/video/);
  });

  it("blocks members from publishing and lets admins unpublish", async () => {
    const blocked = await member
      .post("/reviews")
      .field("carModelId", String(carModelId))
      .field("title", "Nope")
      .attach("video", Buffer.from("x"), { filename: "x.webm", contentType: "video/webm" });
    expect(blocked.status).toBe(403);

    const unpublish = await admin.post(`/reviews/${reviewId}/unpublish`);
    expect(unpublish.status).toBe(200);

    const list = await member.get("/reviews");
    expect(list.body.reviews.some((r: { id: number }) => r.id === reviewId)).toBe(false);
  });
});
