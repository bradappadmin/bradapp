import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { setRequireInviteCode } from "./app-settings.js";
import { DAILY_LOGIN_BONUS, memberStartingCoins } from "./coins.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { ensureUser, seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("auth routes", () => {
  const app = createApp();
  const agent = request.agent(app);
  const memberEmail = `member-${Date.now()}@example.com`;

  beforeAll(async () => {
    await seedAccounts();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email = ?", [memberEmail]);
    await closePool();
  });

  it("rejects invalid sign-up payloads", async () => {
    const res = await agent.post("/auth/signup").send({ email: "nope", password: "short", displayName: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("signs up a member with starter Brad Coins and a seed ledger entry", async () => {
    const signup = await agent.post("/auth/signup").send({
      email: memberEmail,
      password: "MemberPass-123!",
      displayName: "Test Member",
    });
    expect(signup.status).toBe(201);
    expect(signup.body.user.role).toBe("member");
    expect(signup.body.user.coinBalance).toBe(memberStartingCoins());
    expect(signup.headers["set-cookie"]).toBeTruthy();

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(memberEmail);
    // /me may also claim the daily login bonus on top of starter coins.
    expect(me.body.user.coinBalance).toBeGreaterThanOrEqual(memberStartingCoins());

    const wallet = await agent.get("/trade/wallet");
    expect(wallet.status).toBe(200);
    expect(
      wallet.body.ledger.some(
        (e: { reason: string; delta: number; note: string }) =>
          e.reason === "seed" &&
          e.delta === memberStartingCoins() &&
          /starter/i.test(e.note),
      ),
    ).toBe(true);

    const signout = await agent.post("/auth/signout");
    expect(signout.status).toBe(200);

    const meAfter = await agent.get("/auth/me");
    expect(meAfter.status).toBe(401);
  });

  it("signs in the seeded Brad admin without exposing a password", async () => {
    const password = process.env.TEST_BRAD_PASSWORD;
    if (!password) {
      // Skip credential check when the test secret is not supplied locally.
      expect(true).toBe(true);
      return;
    }

    const signin = await request(app).post("/auth/signin").send({
      email: "bradapp.admin@gmail.com",
      password,
    });
    expect(signin.status).toBe(200);
    expect(signin.body.user.role).toBe("admin");
    expect(signin.body.user.email).toBe("bradapp.admin@gmail.com");
    expect(JSON.stringify(signin.body).toLowerCase()).not.toContain("password");
  });

  it("rejects bad credentials", async () => {
    const res = await request(app).post("/auth/signin").send({
      email: "bradapp.admin@gmail.com",
      password: "definitely-not-the-password",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_credentials");
  });

  it("auto-claims a once-per-London-day login bonus on /me with a ledger row", async () => {
    const email = `daily-${Date.now()}@example.com`;
    const agent = request.agent(app);
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "DailyPass-123!",
      displayName: "Daily Claimer",
    });
    expect(signup.status).toBe(201);
    const starting = Number(signup.body.user.coinBalance);

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.dailyLogin.claimedToday).toBe(true);
    expect(me.body.dailyLogin.claimedJustNow).toBe(true);
    expect(me.body.dailyLogin.amount).toBe(DAILY_LOGIN_BONUS);
    expect(me.body.dailyLogin.claimDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(me.body.dailyLogin.streak).toBe(1);
    expect(me.body.dailyLogin.streakBonusAwarded).toBe(0);
    expect(me.body.dailyLogin.streakMilestones).toEqual([
      { streak: 3, coins: 15 },
      { streak: 7, coins: 50 },
    ]);
    expect(me.body.user.coinBalance).toBe(starting + DAILY_LOGIN_BONUS);

    const again = await agent.get("/auth/me");
    expect(again.status).toBe(200);
    expect(again.body.dailyLogin.claimedToday).toBe(true);
    expect(again.body.dailyLogin.claimedJustNow).toBe(false);
    expect(again.body.dailyLogin.claimDate).toBe(me.body.dailyLogin.claimDate);
    expect(again.body.dailyLogin.streak).toBe(1);
    expect(again.body.user.coinBalance).toBe(starting + DAILY_LOGIN_BONUS);

    const status = await agent.get("/auth/daily-bonus");
    expect(status.status).toBe(200);
    expect(status.body.dailyLogin.claimedToday).toBe(true);

    const wallet = await agent.get("/trade/wallet");
    expect(
      wallet.body.ledger.some(
        (e: { reason: string; delta: number; note: string }) =>
          e.reason === "daily_login" &&
          e.delta === DAILY_LOGIN_BONUS &&
          e.note === `Daily login ${me.body.dailyLogin.claimDate}`,
      ),
    ).toBe(true);

    await getPool().query("DELETE FROM users WHERE email = ?", [email]);
  });

  it("changes password for a signed-in member and signs in with the new one", async () => {
    const email = `changepw-${Date.now()}@example.com`;
    const agent = request.agent(app);
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "OldPass-123!",
      displayName: "Change Pw",
    });
    expect(signup.status).toBe(201);

    const badCurrent = await agent.post("/auth/change-password").send({
      currentPassword: "WrongPass-123!",
      newPassword: "NewPass-456!",
      confirmPassword: "NewPass-456!",
    });
    expect(badCurrent.status).toBe(401);

    const mismatch = await agent.post("/auth/change-password").send({
      currentPassword: "OldPass-123!",
      newPassword: "NewPass-456!",
      confirmPassword: "NewPass-999!",
    });
    expect(mismatch.status).toBe(400);

    const sameAsOld = await agent.post("/auth/change-password").send({
      currentPassword: "OldPass-123!",
      newPassword: "OldPass-123!",
      confirmPassword: "OldPass-123!",
    });
    expect(sameAsOld.status).toBe(400);

    const changed = await agent.post("/auth/change-password").send({
      currentPassword: "OldPass-123!",
      newPassword: "NewPass-456!",
      confirmPassword: "NewPass-456!",
    });
    expect(changed.status).toBe(200);
    expect(changed.body.ok).toBe(true);
    expect(JSON.stringify(changed.body).toLowerCase()).not.toContain("password");

    await agent.post("/auth/signout");
    const oldSignin = await request(app).post("/auth/signin").send({
      email,
      password: "OldPass-123!",
    });
    expect(oldSignin.status).toBe(401);

    const newSignin = await request(app).post("/auth/signin").send({
      email,
      password: "NewPass-456!",
    });
    expect(newSignin.status).toBe(200);
    expect(newSignin.body.user.email).toBe(email);

    await getPool().query("DELETE FROM users WHERE email = ?", [email]);
  });

  it("lets a signed-in member update display name and garage bio", async () => {
    const email = `profile-${Date.now()}@example.com`;
    const agent = request.agent(app);
    const signup = await agent.post("/auth/signup").send({
      email,
      password: "ProfilePass-123!",
      displayName: "Old Bay Name",
    });
    expect(signup.status).toBe(201);
    expect(signup.body.user.bio).toBeNull();

    const guest = await request(app).patch("/auth/profile").send({
      displayName: "Nope",
      bio: "Should fail",
    });
    expect(guest.status).toBe(401);

    const tooLong = "x".repeat(161);
    const badBio = await agent.patch("/auth/profile").send({
      displayName: "Still Valid",
      bio: tooLong,
    });
    expect(badBio.status).toBe(400);

    const updated = await agent.patch("/auth/profile").send({
      displayName: "New Bay Name",
      bio: "Short garage bio for the bay.",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.user.displayName).toBe("New Bay Name");
    expect(updated.body.user.bio).toBe("Short garage bio for the bay.");
    expect(updated.body.user.email).toBe(email);

    const me = await agent.get("/auth/me");
    expect(me.body.user.displayName).toBe("New Bay Name");
    expect(me.body.user.bio).toBe("Short garage bio for the bay.");

    const cleared = await agent.patch("/auth/profile").send({
      displayName: "New Bay Name",
      bio: "   ",
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.user.bio).toBeNull();

    const publicGarage = await request(app).get(`/members/${signup.body.user.id}`);
    expect(publicGarage.status).toBe(200);
    expect(publicGarage.body.member.displayName).toBe("New Bay Name");
    expect(publicGarage.body.member.bio).toBeNull();

    await agent.patch("/auth/profile").send({
      displayName: "New Bay Name",
      bio: "Back on the wall.",
    });
    const withBio = await request(app).get(`/members/${signup.body.user.id}`);
    expect(withBio.body.member.bio).toBe("Back on the wall.");

    await getPool().query("DELETE FROM users WHERE email = ?", [email]);
  });

  it("accepts an optional family invite on signup and rejects bad codes", async () => {
    const adminEmail = `invite-admin-${Date.now()}@example.com`;
    const admin = request.agent(app);
    await ensureUser(adminEmail, "AdminPass-123!", "Invite Admin", "admin");
    expect(
      (await admin.post("/auth/signin").send({ email: adminEmail, password: "AdminPass-123!" }))
        .status,
    ).toBe(200);

    const code = `SIGNUP-OK-${Date.now()}`;
    const created = await admin.post("/admin/invites").send({ code, maxUses: 1 });
    expect(created.status).toBe(201);

    const withInvite = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `invite-ok-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "Invitee",
        inviteCode: code,
      });
    expect(withInvite.status).toBe(201);

    const exhausted = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `invite-used-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "Too Late",
        inviteCode: code,
      });
    expect(exhausted.status).toBe(400);
    expect(exhausted.body.error).toBe("invite_exhausted");

    const bad = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `invite-bad-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "No Code",
        inviteCode: "NOT-A-REAL-CODE",
      });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe("invite_not_found");

    // Open signup still works with no invite code.
    const open = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `invite-open-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "Open Join",
      });
    expect(open.status).toBe(201);

    const optionsOpen = await request(app).get("/auth/signup-options");
    expect(optionsOpen.status).toBe(200);
    expect(optionsOpen.body.requireInviteCode).toBe(false);

    await getPool().query("DELETE FROM family_invite_codes WHERE code = ?", [code]);
    await getPool().query("DELETE FROM users WHERE email LIKE 'invite-%@example.com' OR email = ?", [
      adminEmail,
    ]);
  });

  it("blocks open signup when require-invite is on, and allows a valid code", async () => {
    const adminEmail = `req-invite-admin-${Date.now()}@example.com`;
    const admin = request.agent(app);
    await ensureUser(adminEmail, "AdminPass-123!", "Require Invite Admin", "admin");
    expect(
      (await admin.post("/auth/signin").send({ email: adminEmail, password: "AdminPass-123!" }))
        .status,
    ).toBe(200);

    const toggleOn = await admin.put("/admin/invites/require").send({ requireInviteCode: true });
    expect(toggleOn.status).toBe(200);
    expect(toggleOn.body.requireInviteCode).toBe(true);

    const options = await request(app).get("/auth/signup-options");
    expect(options.body.requireInviteCode).toBe(true);

    const missing = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `req-missing-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "Needs Code",
      });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe("invite_required");

    const code = `REQ-OK-${Date.now()}`;
    const created = await admin.post("/admin/invites").send({ code, maxUses: 1 });
    expect(created.status).toBe(201);

    const withCode = await request
      .agent(app)
      .post("/auth/signup")
      .send({
        email: `req-ok-${Date.now()}@example.com`,
        password: "MemberPass-123!",
        displayName: "Has Code",
        inviteCode: code,
      });
    expect(withCode.status).toBe(201);

    await setRequireInviteCode(false);
    await getPool().query("DELETE FROM family_invite_codes WHERE code = ?", [code]);
    await getPool().query(
      "DELETE FROM users WHERE email LIKE 'req-%@example.com' OR email = ?",
      [adminEmail],
    );
  });
});
