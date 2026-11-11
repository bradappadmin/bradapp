import { getPool, type ResultSetHeader, type RowDataPacket } from "./db.js";

export const REQUIRE_INVITE_SETTING_KEY = "require_invite_code";

type SettingRow = RowDataPacket & {
  setting_value: string;
};

function parseBool(raw: string | null | undefined): boolean {
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Whether signup must include a valid family invite code. Default false (open). */
export async function getRequireInviteCode(): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<SettingRow[]>(
    `SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1`,
    [REQUIRE_INVITE_SETTING_KEY],
  );
  const row = rows[0];
  if (!row) return false;
  return parseBool(row.setting_value);
}

export async function setRequireInviteCode(enabled: boolean): Promise<boolean> {
  const pool = getPool();
  const value = enabled ? "1" : "0";
  await pool.query<ResultSetHeader>(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [REQUIRE_INVITE_SETTING_KEY, value],
  );
  return enabled;
}
