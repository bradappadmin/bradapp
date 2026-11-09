import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getRequireInviteCode,
  setRequireInviteCode,
} from "./app-settings.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { runMigrations } from "./migrate.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("app settings require invite", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    await setRequireInviteCode(false);
    await closePool();
  });

  it("defaults to open signup (require invite off)", async () => {
    await setRequireInviteCode(false);
    expect(await getRequireInviteCode()).toBe(false);
  });

  it("persists require-invite on and off", async () => {
    expect(await setRequireInviteCode(true)).toBe(true);
    expect(await getRequireInviteCode()).toBe(true);

    const [rows] = await getPool().query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'require_invite_code'`,
    );
    expect(Array.isArray(rows) && (rows as { setting_value: string }[])[0]?.setting_value).toBe(
      "1",
    );

    expect(await setRequireInviteCode(false)).toBe(false);
    expect(await getRequireInviteCode()).toBe(false);
  });
});
