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
    const models = await admin.get("/reviews/models");
    expect(models.body.models[0].bodyType).toBeTruthy();
    expect(models.body.models[0].colour).toBe("Midnight Black");

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
    expect(res.body.review.type).toBe("review");
    expect(res.body.review.carB).toBeNull();
    expect(res.body.review.status).toBe("published");
    expect(res.body.review.videoUrl).toMatch(/\/reviews\/\d+\/video/);
    expect(res.body.review.car.bodyType).toBeTruthy();
    expect(typeof res.body.review.car.colour).toBe("string");
    expect(res.body.review.car.colour.length).toBeGreaterThan(0);
    expect(typeof res.body.review.car.listingId).toBe("number");
    expect(res.body.review.car.listingId).toBeGreaterThan(0);
    expect(typeof res.body.review.car.listingYear).toBe("number");
    expect(res.body.review.car.listingYear).toBeGreaterThan(0);
    expect(typeof res.body.review.car.listingCoinPrice).toBe("number");
    expect(res.body.review.car.listingCoinPrice).toBeGreaterThanOrEqual(0);
    reviewId = res.body.review.id;
  });

  it("lets an admin publish a drag race with two cars and drag cues", async () => {
    const models = await admin.get("/reviews/models");
    expect(models.body.models.length).toBeGreaterThanOrEqual(2);
    const carA = models.body.models[0].id as number;
    const carB = models.body.models[1].id as number;

    const cues = await admin.get(`/reviews/cues/${carA}`).query({ vs: String(carB) });
    expect(cues.status).toBe(200);
    expect(cues.body.type).toBe("drag_race");
    expect(cues.body.carB.id).toBe(carB);
    expect(cues.body.cueCards.some((c: { id: string }) => c.id === "lane_b")).toBe(true);

    const same = await admin.get(`/reviews/cues/${carA}`).query({ vs: String(carA) });
    expect(same.status).toBe(400);

    const res = await admin
      .post("/reviews")
      .field("type", "drag_race")
      .field("carModelId", String(carA))
      .field("carModelBId", String(carB))
      .field("title", "Bay drag — GT vs GT")
      .attach("video", Buffer.from("fake-drag-webm"), {
        filename: "drag.webm",
        contentType: "video/webm",
      });
    expect(res.status).toBe(201);
    expect(res.body.review.type).toBe("drag_race");
    expect(res.body.review.car.id).toBe(carA);
    expect(res.body.review.carB.id).toBe(carB);
    expect(res.body.review.cueCards.some((c: { id: string }) => c.id === "lights")).toBe(true);

    const listed = await member.get("/reviews");
    const drag = listed.body.reviews.find((r: { id: number }) => r.id === res.body.review.id);
    expect(drag?.type).toBe("drag_race");
    expect(drag?.carB?.id).toBe(carB);

    const onlyDrag = await member.get("/reviews").query({ type: "drag_race" });
    expect(onlyDrag.status).toBe(200);
    expect(onlyDrag.body.reviews.length).toBeGreaterThanOrEqual(1);
    expect(onlyDrag.body.reviews.every((r: { type: string }) => r.type === "drag_race")).toBe(true);

    const onlyCue = await member.get("/reviews").query({ type: "review" });
    expect(onlyCue.status).toBe(200);
    expect(onlyCue.body.reviews.every((r: { type: string }) => r.type === "review")).toBe(true);
    expect(onlyCue.body.reviews.some((r: { id: number }) => r.id === res.body.review.id)).toBe(
      false,
    );

    const badType = await member.get("/reviews").query({ type: "podcast" });
    expect(badType.status).toBe(400);
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

  it("lets admins pin one published review as featured", async () => {
    const guestFeature = await request(app).get("/reviews/featured");
    expect(guestFeature.status).toBe(200);
    expect(guestFeature.body.review).toBeNull();

    const blocked = await member.post(`/reviews/${reviewId}/feature`);
    expect(blocked.status).toBe(403);

    const pinned = await admin.post(`/reviews/${reviewId}/feature`);
    expect(pinned.status).toBe(200);
    expect(pinned.body.review.featured).toBe(true);

    const featured = await request(app).get("/reviews/featured");
    expect(featured.status).toBe(200);
    expect(featured.body.review?.id).toBe(reviewId);
    expect(featured.body.review?.featured).toBe(true);

    const second = await admin
      .post("/reviews")
      .field("carModelId", String(carModelId))
      .field("title", "Second bay clip")
      .attach("video", Buffer.from("fake-webm-bytes-2"), {
        filename: "clip2.webm",
        contentType: "video/webm",
      });
    expect(second.status).toBe(201);
    const secondId = second.body.review.id as number;

    const repin = await admin.post(`/reviews/${secondId}/feature`);
    expect(repin.status).toBe(200);
    expect(repin.body.review.featured).toBe(true);

    const afterRepin = await request(app).get("/reviews/featured");
    expect(afterRepin.body.review?.id).toBe(secondId);

    const firstDetail = await admin.get(`/reviews/${reviewId}`);
    expect(firstDetail.body.review.featured).toBe(false);

    const unpinned = await admin.delete(`/reviews/${secondId}/feature`);
    expect(unpinned.status).toBe(200);
    expect(unpinned.body.review?.featured).toBe(false);

    const empty = await request(app).get("/reviews/featured");
    expect(empty.body.review).toBeNull();

    await admin.post(`/reviews/${reviewId}/feature`);
  });

  it("lets members like and unlike a published review", async () => {
    const guest = await request(app).post(`/reviews/${reviewId}/like`);
    expect(guest.status).toBe(401);

    const liked = await member.post(`/reviews/${reviewId}/like`);
    expect(liked.status).toBe(200);
    expect(liked.body).toMatchObject({ ok: true, liked: true, likeCount: 1 });

    const detail = await member.get(`/reviews/${reviewId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.review.likeCount).toBe(1);
    expect(detail.body.review.likedByMe).toBe(true);

    const list = await member.get("/reviews");
    const listed = list.body.reviews.find((r: { id: number }) => r.id === reviewId);
    expect(listed?.likeCount).toBe(1);
    expect(listed?.likedByMe).toBe(true);

    const publicList = await request(app).get("/reviews");
    const publicListed = publicList.body.reviews.find((r: { id: number }) => r.id === reviewId);
    expect(publicListed?.likeCount).toBe(1);
    expect(publicListed?.likedByMe).toBe(false);

    const again = await member.post(`/reviews/${reviewId}/like`);
    expect(again.status).toBe(200);
    expect(again.body.likeCount).toBe(1);

    const unliked = await member.delete(`/reviews/${reviewId}/like`);
    expect(unliked.status).toBe(200);
    expect(unliked.body).toMatchObject({ ok: true, liked: false, likeCount: 0 });

    const after = await member.get(`/reviews/${reviewId}`);
    expect(after.body.review.likeCount).toBe(0);
    expect(after.body.review.likedByMe).toBe(false);
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

    const cannotLike = await member.post(`/reviews/${reviewId}/like`);
    expect(cannotLike.status).toBe(404);

    const cannotFeature = await admin.post(`/reviews/${reviewId}/feature`);
    expect(cannotFeature.status).toBe(404);

    const featuredGone = await request(app).get("/reviews/featured");
    expect(featuredGone.body.review).toBeNull();

    const list = await member.get("/reviews");
    expect(list.body.reviews.some((r: { id: number }) => r.id === reviewId)).toBe(false);
  });
});
