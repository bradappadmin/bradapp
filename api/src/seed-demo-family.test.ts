import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MEMBER_STARTING_COINS } from "./coins.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { verifyPassword } from "./password.js";
import {
  DEMO_FAMILY_MEMBERS,
  DEMO_MEMBER_PASSWORD_HASH,
  seedAccounts,
} from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe("demo family password hash", () => {
  it("is a bcrypt hash and matches TEST_DEMO_MEMBER_PASSWORD when provided", async () => {
    expect(DEMO_MEMBER_PASSWORD_HASH.startsWith("$2a$")).toBe(true);
    const password = process.env.TEST_DEMO_MEMBER_PASSWORD;
    if (!password) {
      return;
    }
    expect(await verifyPassword(password, DEMO_MEMBER_PASSWORD_HASH)).toBe(true);
  });
});

describe.runIf(hasDb)("demo family seed", () => {
  const app = createApp();

  beforeAll(async () => {
    await seedAccounts();
  });

  afterAll(async () => {
    await closePool();
  });

  it("seeds three demo members with cars and Brad Coins", async () => {
    const pool = getPool();
    for (const member of DEMO_FAMILY_MEMBERS) {
      const [rows] = await pool.query(
        `SELECT u.id, u.role, u.coin_balance,
                (SELECT COUNT(*) FROM listings l WHERE l.owner_user_id = u.id) AS car_count
         FROM users u WHERE u.email = ? LIMIT 1`,
        [member.email],
      );
      const row = (
        rows as Array<{
          id: number;
          role: string;
          coin_balance: number;
          car_count: number;
        }>
      )[0];
      expect(row).toBeTruthy();
      expect(row.role).toBe("member");
      expect(Number(row.coin_balance)).toBeGreaterThanOrEqual(MEMBER_STARTING_COINS);
      expect(Number(row.car_count)).toBeGreaterThanOrEqual(member.carCount);
    }
  });

  it("exposes demo members for challenges and rival Top Trumps cards", async () => {
    const agent = request.agent(app);
    // Prefer DEMO_MEMBER_PASSWORD (runtime seed override), else TEST_DEMO_MEMBER_PASSWORD
    // against the committed hash. Skip sign-in when neither is set.
    const password =
      process.env.DEMO_MEMBER_PASSWORD || process.env.TEST_DEMO_MEMBER_PASSWORD;

    if (!password) {
      const [countRows] = await getPool().query(
        `SELECT COUNT(*) AS count FROM users WHERE email IN (?, ?, ?)`,
        DEMO_FAMILY_MEMBERS.map((m) => m.email),
      );
      expect(Number((countRows as Array<{ count: number }>)[0]?.count)).toBe(3);
      return;
    }

    const signin = await agent.post("/auth/signin").send({
      email: DEMO_FAMILY_MEMBERS[0].email,
      password,
    });
    expect(signin.status).toBe(200);

    const members = await agent.get("/members");
    expect(members.status).toBe(200);
    for (const member of DEMO_FAMILY_MEMBERS) {
      const found = members.body.members.find(
        (m: { displayName: string }) => m.displayName === member.displayName,
      );
      expect(found).toBeTruthy();
      expect(found.carCount).toBeGreaterThanOrEqual(1);
    }

    const cards = await agent.get("/play/cards/members");
    expect(cards.status).toBe(200);
    expect(cards.body.cards.length).toBeGreaterThanOrEqual(2);
  });
});
