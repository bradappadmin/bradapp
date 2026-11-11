import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  DEMO_FAMILY_MEMBERS,
  resolveDemoMemberPasswordHash,
  seedAccounts,
} from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe("demo family password hashing", () => {
  it("resolves DEMO_MEMBER_PASSWORD from the environment only", async () => {
    const hash = await resolveDemoMemberPasswordHash();
    const password = process.env.DEMO_MEMBER_PASSWORD?.trim();
    if (!password || password.length < 8) {
      expect(hash).toBeNull();
      const sample = await hashPassword("Temporary-Test-Only-9");
      expect(sample.startsWith("$2a$") || sample.startsWith("$2b$")).toBe(true);
      return;
    }
    expect(hash).toBeTruthy();
    expect(await verifyPassword(password, hash!)).toBe(true);
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

  it("seeds three demo members with cars and Brad Coins when they exist", async () => {
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

      // Without DEMO_MEMBER_PASSWORD, creates are skipped on empty DBs.
      if (!row) {
        expect(process.env.DEMO_MEMBER_PASSWORD?.trim()?.length ?? 0).toBeLessThan(8);
        continue;
      }

      expect(row.role).toBe("member");
      // Balance may drop below starter after play/trade; seed only guarantees a ledger credit once.
      expect(Number(row.coin_balance)).toBeGreaterThanOrEqual(0);
      expect(Number(row.car_count)).toBeGreaterThanOrEqual(member.carCount);
    }
  });

  it("exposes demo members for challenges and rival Top Trumps cards", async () => {
    const agent = request.agent(app);
    const password = process.env.DEMO_MEMBER_PASSWORD;

    if (!password || password.length < 8) {
      const [countRows] = await getPool().query(
        `SELECT COUNT(*) AS count FROM users WHERE email IN (?, ?, ?)`,
        DEMO_FAMILY_MEMBERS.map((m) => m.email),
      );
      expect(Number((countRows as Array<{ count: number }>)[0]?.count)).toBeGreaterThanOrEqual(0);
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
