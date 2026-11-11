import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool, type RowDataPacket } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("members routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const email = `members-${Date.now()}@example.com`;
  let otherEmail = "";
  let selfId = 0;
  let otherId = 0;
  let otherCarId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await agent
      .post("/auth/signup")
      .send({ email, password: "MembersPass-123!", displayName: "Members Tester" });
    expect(signup.status).toBe(201);
    selfId = Number(signup.body.user.id);

    otherEmail = `members-other-${Date.now()}@example.com`;
    const other = await request(app)
      .post("/auth/signup")
      .send({ email: otherEmail, password: "MembersPass-123!", displayName: "Challenge Rival" });
    expect(other.status).toBe(201);
    otherId = Number(other.body.user.id);

    const otherAgent = request.agent(app);
    expect(
      (await otherAgent.post("/auth/signin").send({ email: otherEmail, password: "MembersPass-123!" }))
        .status,
    ).toBe(200);
    const pool = getPool();
    const [listingRows] = await pool.query<(RowDataPacket & { id: number })[]>(
      `SELECT id FROM listings ORDER BY id ASC LIMIT 1`,
    );
    expect(listingRows[0]).toBeTruthy();
    otherCarId = Number(listingRows[0]!.id);
    await pool.query(
      `UPDATE listings
       SET owner_user_id = ?, owner_label = ?, status = 'owned'
       WHERE id = ?`,
      [otherId, "Challenge Rival", otherCarId],
    );
    await pool.query(`UPDATE users SET showcase_listing_id = NULL WHERE showcase_listing_id = ?`, [
      otherCarId,
    ]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email LIKE 'members-%@example.com'");
    await closePool();
  });

  it("lists members with role, balance, and car count", async () => {
    const res = await agent.get("/members");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
    const self = res.body.members.find((m: { id: number }) => m.id === selfId);
    expect(self).toMatchObject({
      displayName: "Members Tester",
      role: "member",
      carCount: 0,
      bio: null,
    });
    expect(typeof self.coinBalance).toBe("number");
    expect(self).not.toHaveProperty("email");
    expect(self).not.toHaveProperty("password_hash");
    const rival = res.body.members.find((m: { id: number }) => m.id === otherId);
    expect(rival.carCount).toBeGreaterThanOrEqual(1);

    const demo = res.body.members.find((m: { displayName: string }) => m.displayName === "Sam Bay");
    if (demo) {
      expect(typeof demo.bio === "string" || demo.bio === null).toBe(true);
    }
  });

  it("returns a public member garage with cars and no secrets", async () => {
    // Unsigned request — garage pages are public.
    const res = await request(app).get(`/members/${otherId}`);
    expect(res.status).toBe(200);
    expect(res.body.member.id).toBe(otherId);
    expect(res.body.member.carCount).toBeGreaterThanOrEqual(1);
    expect(res.body.member).not.toHaveProperty("email");
    expect(res.body.member).not.toHaveProperty("passwordHash");
    expect(res.body.member).not.toHaveProperty("password_hash");
    const car = res.body.cars.find((c: { id: number }) => c.id === otherCarId);
    expect(car).toBeTruthy();
    expect(typeof car.coinPrice).toBe("number");
    expect(car).not.toHaveProperty("owner_user_id");
    expect(res.body.showcase).toBeTruthy();
    expect(["pinned", "highest_value"]).toContain(res.body.showcaseSource);
    expect(typeof res.body.showcase.coinPrice).toBe("number");
  });

  it("lists members without signing in", async () => {
    const res = await request(app).get("/members");
    expect(res.status).toBe(200);
    expect(res.body.members.length).toBeGreaterThan(0);
  });

  it("filters members by display name with q", async () => {
    const res = await request(app).get("/members").query({ q: "Challenge Rival" });
    expect(res.status).toBe(200);
    expect(res.body.q).toBe("Challenge Rival");
    expect(res.body.members.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.members.every((m: { displayName: string }) =>
        m.displayName.toLowerCase().includes("challenge rival"),
      ),
    ).toBe(true);
    expect(JSON.stringify(res.body).toLowerCase()).not.toContain("password");
    expect(res.body.members[0]).not.toHaveProperty("email");
  });

  it("matches email local-part as a fallback name without exposing email", async () => {
    const localPart = otherEmail.split("@")[0]!;
    const rival = await request(app).get("/members").query({ q: localPart });
    expect(rival.status).toBe(200);
    const hit = rival.body.members.find((m: { id: number }) => m.id === otherId);
    expect(hit).toBeTruthy();
    expect(hit.displayName).toBe("Challenge Rival");
    expect(hit).not.toHaveProperty("email");
    expect(JSON.stringify(rival.body).toLowerCase()).not.toContain(otherEmail.toLowerCase());
  });

  it("filters member cards by owner for Top Trumps challenges", async () => {
    const res = await agent.get("/play/cards/members").query({ ownerUserId: otherId });
    expect(res.status).toBe(200);
    expect(res.body.cards.length).toBeGreaterThanOrEqual(1);
    expect(res.body.cards.every((c: { ownerUserId: number }) => c.ownerUserId === otherId)).toBe(
      true,
    );
  });

  it("gifts Brad Coins to another member with ledger gift_sent / gift_received", async () => {
    const beforeSelf = await agent.get("/auth/me");
    expect(beforeSelf.status).toBe(200);
    const beforeBalance = Number(beforeSelf.body.user.coinBalance);

    const beforeOther = await request(app).get(`/members/${otherId}`);
    expect(beforeOther.status).toBe(200);
    const beforeReceiver = Number(beforeOther.body.member.coinBalance);

    const gift = await agent.post(`/members/${otherId}/gift`).send({
      amount: 15,
      note: "Bay tip",
    });
    expect(gift.status).toBe(200);
    expect(gift.body.ok).toBe(true);
    expect(gift.body.amount).toBe(15);
    expect(gift.body.senderBalance).toBe(beforeBalance - 15);
    expect(gift.body.receiverBalance).toBe(beforeReceiver + 15);
    expect(gift.body.receiver.displayName).toBe("Challenge Rival");

    const wallet = await agent.get("/trade/wallet");
    expect(wallet.status).toBe(200);
    expect(wallet.body.balance).toBe(beforeBalance - 15);
    expect(
      wallet.body.ledger.some(
        (e: { reason: string; delta: number; note: string }) =>
          e.reason === "gift_sent" && e.delta === -15 && e.note.includes("Bay tip"),
      ),
    ).toBe(true);

    const otherAgent = request.agent(app);
    expect(
      (await otherAgent.post("/auth/signin").send({ email: otherEmail, password: "MembersPass-123!" }))
        .status,
    ).toBe(200);
    const otherWallet = await otherAgent.get("/trade/wallet");
    expect(otherWallet.status).toBe(200);
    expect(otherWallet.body.balance).toBe(beforeReceiver + 15);
    expect(
      otherWallet.body.ledger.some(
        (e: { reason: string; delta: number; note: string }) =>
          e.reason === "gift_received" && e.delta === 15 && e.note.includes("Bay tip"),
      ),
    ).toBe(true);
  });

  it("rejects gifts that exceed balance, self-gifts, and unauthenticated gifts", async () => {
    const selfGift = await agent.post(`/members/${selfId}/gift`).send({ amount: 5 });
    expect(selfGift.status).toBe(400);

    const before = await agent.get("/auth/me");
    expect(before.status).toBe(200);
    const balance = Number(before.body.user.coinBalance);
    const tooMuch = await agent
      .post(`/members/${otherId}/gift`)
      .send({ amount: Math.max(balance + 1, 1) });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.error).toBe("insufficient_coins");

    const anon = await request(app).post(`/members/${otherId}/gift`).send({ amount: 5 });
    expect(anon.status).toBe(401);
  });
});
