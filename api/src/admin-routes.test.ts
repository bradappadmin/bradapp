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

describe.runIf(hasDb)("admin routes", () => {
  const app = createApp();
  const admin = request.agent(app);
  const member = request.agent(app);
  const adminEmail = `admin-area-${Date.now()}@example.com`;
  const memberEmail = `admin-member-${Date.now()}@example.com`;
  let memberId = 0;
  let listingId = 0;
  let garageId = 0;
  let modelId = 0;

  beforeAll(async () => {
    await seedAccounts();
    await ensureUser(adminEmail, "AdminPass-123!", "Area Admin", "admin");
    expect(
      (await admin.post("/auth/signin").send({ email: adminEmail, password: "AdminPass-123!" })).status,
    ).toBe(200);
    const signup = await member.post("/auth/signup").send({
      email: memberEmail,
      password: "MemberPass-123!",
      displayName: "Area Member",
    });
    expect(signup.status).toBe(201);
    memberId = signup.body.user.id;

    const listings = await admin.get("/admin/listings");
    listingId = listings.body.listings[0].id;
    garageId = listings.body.listings[0].garageId;
    const models = await admin.get("/admin/car-models");
    modelId = models.body.models[0].id;
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email IN (?, ?)", [adminEmail, memberEmail]);
    await closePool();
  });

  it("blocks members from the admin area", async () => {
    const res = await member.get("/admin/users");
    expect(res.status).toBe(403);
  });

  it("lists users and corrects a member display name", async () => {
    const list = await admin.get("/admin/users");
    expect(list.status).toBe(200);
    expect(list.body.users.some((u: { email: string }) => u.email === memberEmail)).toBe(true);

    const patch = await admin.patch(`/admin/users/${memberId}`).send({ displayName: "Corrected Member" });
    expect(patch.status).toBe(200);
    expect(patch.body.user.displayName).toBe("Corrected Member");
  });

  it("adjusts Brad Coin balances through the ledger", async () => {
    const res = await admin.post(`/admin/users/${memberId}/coins`).send({
      delta: 50,
      note: "Goodwill top-up",
    });
    expect(res.status).toBe(200);
    expect(res.body.balance).toBeGreaterThanOrEqual(250);
    expect(res.body.ledger.some((e: { reason: string }) => e.reason === "admin_adjust")).toBe(true);
  });

  it("lists admin coin-adjust history with actor, target, delta, note, and time", async () => {
    const blocked = await member.get("/admin/coin-adjustments");
    expect(blocked.status).toBe(403);

    const res = await admin.get("/admin/coin-adjustments").query({ limit: 20 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.adjustments)).toBe(true);
    const hit = res.body.adjustments.find(
      (row: {
        userEmail: string;
        note: string;
        delta: number;
        createdByDisplayName: string | null;
      }) => row.userEmail === memberEmail && row.note === "Goodwill top-up",
    );
    expect(hit).toBeTruthy();
    expect(hit.delta).toBe(50);
    expect(hit.createdByDisplayName).toBe("Area Admin");
    expect(hit.createdAt).toBeTruthy();
    expect(hit.balanceAfter).toBeGreaterThan(0);
  });

  it("edits garages, car models, and listings", async () => {
    const garage = await admin.patch(`/admin/garages/${garageId}`).send({ tagline: "Admin-tuned bay." });
    expect(garage.status).toBe(200);
    expect(garage.body.garage.tagline).toBe("Admin-tuned bay.");

    const model = await admin.patch(`/admin/car-models/${modelId}`).send({ bhp: 999 });
    expect(model.status).toBe(200);
    expect(Number(model.body.model.bhp)).toBe(999);

    const listing = await admin.patch(`/admin/listings/${listingId}`).send({ coinPrice: 123 });
    expect(listing.status).toBe(200);
    expect(Number(listing.body.listing.coinPrice)).toBe(123);
  });

  it("prevents Brad from promoting a member to super_admin", async () => {
    const res = await admin.patch(`/admin/users/${memberId}`).send({ role: "super_admin" });
    expect(res.status).toBe(403);
  });
});
