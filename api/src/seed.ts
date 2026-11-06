import {
  ADMIN_STARTING_COINS,
  MEMBER_STARTING_COINS,
  creditSeedIfNeeded,
} from "./coins.js";
import { closePool, getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";
import { loadEnv } from "./env.js";
import { hashPassword } from "./password.js";
import { runMigrations } from "./migrate.js";
import { seedCars } from "./seed-cars.js";

loadEnv();

/** Brad admin seed — bcrypt hash only. Plaintext is never stored in this repo. */
const BRAD_ADMIN_EMAIL = "bradapp.admin@gmail.com";
const BRAD_ADMIN_NAME = "Brad";
const BRAD_ADMIN_PASSWORD_HASH =
  "$2a$12$EpJhNF5BOG5tE8Un1njOw.QPa6MGZJ.Hd264KxKounBEWe5q0aohm";

export async function seedAccounts(): Promise<void> {
  await runMigrations();
  const pool = getPool();

  await pool.query(
    `INSERT INTO users (email, password_hash, display_name, role, account_status)
     VALUES (?, ?, ?, 'admin', 'active')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       display_name = VALUES(display_name),
       role = 'admin',
       account_status = 'active'`,
    [BRAD_ADMIN_EMAIL, BRAD_ADMIN_PASSWORD_HASH, BRAD_ADMIN_NAME],
  );

  const superEmail = process.env.SEED_SUPER_ADMIN_EMAIL?.trim();
  const superPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const superName = process.env.SEED_SUPER_ADMIN_NAME?.trim() || "Napwood";

  if (superEmail && superPassword) {
    const passwordHash = await hashPassword(superPassword);
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES (?, ?, ?, 'super_admin')
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         display_name = VALUES(display_name),
         role = 'super_admin'`,
      [superEmail, passwordHash, superName],
    );
  }

  await seedCars();

  const [users] = await pool.query<(RowDataPacket & { id: number; role: string })[]>(
    "SELECT id, role FROM users",
  );
  for (const user of users) {
    const amount =
      user.role === "member" ? MEMBER_STARTING_COINS : ADMIN_STARTING_COINS;
    await creditSeedIfNeeded(Number(user.id), amount, "Starting Brad Coins");
  }

  await seedBradStarterGarage();
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

  const [owned] = await pool.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM listings WHERE owner_user_id = ?",
    [bradId],
  );
  if (Number(owned[0]?.count ?? 0) > 0) return;

  // Prefer mid-priced stock so cheap listings stay available for buy/play tests.
  await pool.query(
    `UPDATE listings
     SET owner_user_id = ?, owner_label = ?, status = 'owned'
     WHERE status = 'available' AND owner_user_id IS NULL
     ORDER BY coin_price DESC
     LIMIT 2`,
    [bradId, BRAD_ADMIN_NAME],
  );
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
