import {
  ADMIN_STARTING_COINS,
  creditSeedIfNeeded,
  memberStartingCoins,
} from "./coins.js";
import { closePool, getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { loadEnv } from "./env.js";
import { seedDemoFamilyInvite } from "./invite-codes.js";
import { hashPassword } from "./password.js";
import { runMigrations } from "./migrate.js";
import { seedCars } from "./seed-cars.js";

loadEnv();

/** Brad admin identity for seed (password only from env — never a committed hash). */
const BRAD_ADMIN_EMAIL = "bradapp.admin@gmail.com";
const BRAD_ADMIN_NAME = "Brad";
const BRAD_ADMIN_BIO = "Bay host — reviews, drag races, and fair play.";

/**
 * Demo family members for challenges/trades out of the box.
 * Passwords only from DEMO_MEMBER_PASSWORD (hashed at runtime; never committed).
 */
export const DEMO_FAMILY_MEMBERS = [
  {
    email: "sam.bay@example.com",
    displayName: "Sam Bay",
    bio: "Weekend bay runs and fair trades.",
    carCount: 2,
  },
  {
    email: "jordan.lap@example.com",
    displayName: "Jordan Lap",
    bio: "Top Trumps first, chat later.",
    carCount: 2,
  },
  {
    email: "casey.apex@example.com",
    displayName: "Casey Apex",
    bio: "Collecting pace. Trading for fun.",
    carCount: 2,
  },
] as const;

function resolveBradAdminPassword(): string | null {
  const fromEnv =
    process.env.BRAD_ADMIN_PASSWORD?.trim() ||
    process.env.SEED_BRAD_ADMIN_PASSWORD?.trim() ||
    "";
  if (!fromEnv || fromEnv.length < 8) {
    return null;
  }
  return fromEnv;
}

async function seedBradAdminAccount(): Promise<void> {
  const pool = getPool();
  const password = resolveBradAdminPassword();

  if (password) {
    const passwordHash = await hashPassword(password);
    // Insert when missing; never overwrite password_hash on existing Brad.
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, bio, role, account_status)
       VALUES (?, ?, ?, ?, 'admin', 'active')
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         bio = COALESCE(users.bio, VALUES(bio)),
         role = 'admin',
         account_status = 'active'`,
      [BRAD_ADMIN_EMAIL, passwordHash, BRAD_ADMIN_NAME, BRAD_ADMIN_BIO],
    );
    return;
  }

  await pool.query(
    `UPDATE users
     SET display_name = ?, bio = COALESCE(bio, ?), role = 'admin', account_status = 'active'
     WHERE email = ?`,
    [BRAD_ADMIN_NAME, BRAD_ADMIN_BIO, BRAD_ADMIN_EMAIL],
  );
}

export async function seedAccounts(): Promise<void> {
  await runMigrations();
  const pool = getPool();

  await seedBradAdminAccount();

  const superEmail = process.env.SEED_SUPER_ADMIN_EMAIL?.trim();
  const superPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const superName = process.env.SEED_SUPER_ADMIN_NAME?.trim() || "Napwood";

  if (superEmail && superPassword) {
    const passwordHash = await hashPassword(superPassword);
    // Insert when missing; never overwrite password_hash on existing super_admin.
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES (?, ?, ?, 'super_admin')
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         role = 'super_admin'`,
      [superEmail, passwordHash, superName],
    );
  }

  await seedDemoFamilyMembers();

  await seedCars();

  const [users] = await pool.query<(RowDataPacket & { id: number; role: string })[]>(
    "SELECT id, role FROM users",
  );
  for (const user of users) {
    const amount =
      user.role === "member" ? memberStartingCoins() : ADMIN_STARTING_COINS;
    await creditSeedIfNeeded(Number(user.id), amount, "Starter Brad Coins");
  }

  await seedBradStarterGarage();
  await seedDemoFamilyGarages();
  await ensureAffordableStock(12);

  const [bradRows] = await pool.query<(RowDataPacket & { id: number })[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [BRAD_ADMIN_EMAIL],
  );
  const bradId = bradRows[0]?.id;
  if (bradId) {
    await seedDemoFamilyInvite(Number(bradId));
  }
}

/**
 * Keep a pocket of buyable stock so play/trade/member tests (and walkthroughs)
 * can purchase with memberStartingCoins() after starter garages are filled.
 */
async function ensureAffordableStock(minCount: number): Promise<void> {
  const pool = getPool();
  const starter = memberStartingCoins();
  const [countRows] = await pool.query<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) AS count
     FROM listings
     WHERE status = 'available' AND owner_user_id IS NULL AND coin_price <= ?`,
    [starter],
  );
  const have = Number(countRows[0]?.count ?? 0);
  if (have >= minCount) return;
  const need = minCount - have;
  const targetPrice = Math.min(150, starter);
  await pool.query(
    `UPDATE listings
     SET coin_price = ?
     WHERE status = 'available' AND owner_user_id IS NULL AND coin_price > ?
     ORDER BY coin_price ASC
     LIMIT ?`,
    [targetPrice, starter, need],
  );
}

/** Resolves demo member password from DEMO_MEMBER_PASSWORD only (never a committed hash). */
export async function resolveDemoMemberPasswordHash(): Promise<string | null> {
  const fromEnv = process.env.DEMO_MEMBER_PASSWORD?.trim();
  if (!fromEnv || fromEnv.length < 8) {
    return null;
  }
  return hashPassword(fromEnv);
}

async function seedDemoFamilyMembers(): Promise<void> {
  const pool = getPool();
  const passwordHash = await resolveDemoMemberPasswordHash();

  for (const member of DEMO_FAMILY_MEMBERS) {
    if (passwordHash) {
      // Insert when missing; never overwrite password_hash on existing demo users.
      await pool.query(
        `INSERT INTO users (email, password_hash, display_name, bio, role, account_status)
         VALUES (?, ?, ?, ?, 'member', 'active')
         ON DUPLICATE KEY UPDATE
           display_name = VALUES(display_name),
           bio = COALESCE(users.bio, VALUES(bio)),
           role = 'member',
           account_status = 'active'`,
        [member.email, passwordHash, member.displayName, member.bio],
      );
      continue;
    }

    await pool.query(
      `UPDATE users
       SET display_name = ?, bio = COALESCE(users.bio, ?), role = 'member', account_status = 'active'
       WHERE email = ?`,
      [member.displayName, member.bio, member.email],
    );
  }
}

/** Assign owned cars to a user until they hold at least `want` (idempotent). */
async function ensureOwnedCars(
  userId: number,
  displayName: string,
  want: number,
): Promise<void> {
  const pool = getPool();
  const [owned] = await pool.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM listings WHERE owner_user_id = ?",
    [userId],
  );
  const have = Number(owned[0]?.count ?? 0);
  if (have >= want) return;
  const need = want - have;
  // Mid-priced stock so cheap listings stay available for buy/play tests.
  await pool.query(
    `UPDATE listings
     SET owner_user_id = ?, owner_label = ?, status = 'owned'
     WHERE status = 'available' AND owner_user_id IS NULL
     ORDER BY coin_price DESC
     LIMIT ?`,
    [userId, displayName, need],
  );
}

/** Give Brad two owned cars so Top Trumps works on first walkthrough. */
async function seedBradStarterGarage(): Promise<void> {
  const pool = getPool();
  const [bradRows] = await pool.query<(RowDataPacket & { id: number })[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [BRAD_ADMIN_EMAIL],
  );
  const bradId = bradRows[0]?.id;
  if (!bradId) return;
  await ensureOwnedCars(bradId, BRAD_ADMIN_NAME, 2);
}

async function seedDemoFamilyGarages(): Promise<void> {
  const pool = getPool();
  for (const member of DEMO_FAMILY_MEMBERS) {
    const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [member.email],
    );
    const userId = rows[0]?.id;
    if (!userId) continue;
    await ensureOwnedCars(Number(userId), member.displayName, member.carCount);
  }
}

export async function countUsersByRole(role: string): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM users WHERE role = ?",
    [role],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function ensureUser(
  email: string,
  password: string,
  displayName: string,
  role: "super_admin" | "admin" | "member",
): Promise<number> {
  const pool = getPool();
  const passwordHash = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, display_name, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       display_name = VALUES(display_name),
       role = VALUES(role)`,
    [email, passwordHash, displayName, role],
  );
  if (result.insertId) {
    return result.insertId;
  }
  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  return Number(rows[0].id);
}

async function main(): Promise<void> {
  try {
    await seedAccounts();
    console.log("Seed complete (accounts + cars + coins).");
  } finally {
    await closePool();
  }
}

const isDirectRun = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
