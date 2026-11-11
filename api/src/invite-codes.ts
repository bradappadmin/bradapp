import { randomBytes } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "./db.js";
import { getPool } from "./db.js";

export type InviteCodeRow = {
  id: number;
  code: string;
  createdByUserId: number;
  createdByDisplayName: string | null;
  createdAt: string;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type InviteValidationFailure =
  | "not_found"
  | "revoked"
  | "expired"
  | "exhausted";

type InviteDbRow = RowDataPacket & {
  id: number;
  code: string;
  created_by_user_id: number;
  created_by_display_name: string | null;
  created_at: Date;
  max_uses: number | null;
  uses_count: number;
  expires_at: Date | null;
  revoked_at: Date | null;
};

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,63}$/;

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidInviteCodeFormat(code: string): boolean {
  return CODE_PATTERN.test(code);
}

export function generateInviteCode(): string {
  const token = randomBytes(4).toString("hex").toUpperCase();
  return `BAY-${token}`;
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function mapInvite(row: InviteDbRow): InviteCodeRow {
  return {
    id: Number(row.id),
    code: row.code,
    createdByUserId: Number(row.created_by_user_id),
    createdByDisplayName: row.created_by_display_name,
    createdAt: new Date(row.created_at).toISOString(),
    maxUses: row.max_uses == null ? null : Number(row.max_uses),
    usesCount: Number(row.uses_count),
    expiresAt: toIso(row.expires_at),
    revokedAt: toIso(row.revoked_at),
  };
}

const SELECT_INVITE = `
  SELECT c.id, c.code, c.created_by_user_id, u.display_name AS created_by_display_name,
         c.created_at, c.max_uses, c.uses_count, c.expires_at, c.revoked_at
  FROM family_invite_codes c
  LEFT JOIN users u ON u.id = c.created_by_user_id
`;

export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const pool = getPool();
  const [rows] = await pool.query<InviteDbRow[]>(
    `${SELECT_INVITE} ORDER BY c.id DESC LIMIT 100`,
  );
  return rows.map(mapInvite);
}

export async function createInviteCode(input: {
  createdByUserId: number;
  code?: string;
  maxUses?: number | null;
  expiresAt?: Date | null;
}): Promise<InviteCodeRow> {
  const pool = getPool();
  let code = input.code ? normalizeInviteCode(input.code) : generateInviteCode();
  if (!isValidInviteCodeFormat(code)) {
    throw new Error("invalid_code_format");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO family_invite_codes
           (code, created_by_user_id, max_uses, expires_at)
         VALUES (?, ?, ?, ?)`,
        [
          code,
          input.createdByUserId,
          input.maxUses ?? null,
          input.expiresAt ?? null,
        ],
      );
      const [rows] = await pool.query<InviteDbRow[]>(
        `${SELECT_INVITE} WHERE c.id = ? LIMIT 1`,
        [result.insertId],
      );
      const row = rows[0];
      if (!row) throw new Error("invite_missing_after_insert");
      return mapInvite(row);
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === "ER_DUP_ENTRY" && !input.code) {
        code = generateInviteCode();
        continue;
      }
      if (err.code === "ER_DUP_ENTRY") {
        throw new Error("code_taken");
      }
      throw error;
    }
  }
  throw new Error("could_not_allocate_code");
}

export async function revokeInviteCode(id: number): Promise<InviteCodeRow | null> {
  const pool = getPool();
  await pool.query(
    `UPDATE family_invite_codes
     SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
     WHERE id = ?`,
    [id],
  );
  const [rows] = await pool.query<InviteDbRow[]>(
    `${SELECT_INVITE} WHERE c.id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  return row ? mapInvite(row) : null;
}

export function validateInviteRow(
  row: InviteCodeRow,
  now = new Date(),
): InviteValidationFailure | null {
  if (row.revokedAt) return "revoked";
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime()) return "expired";
  if (row.maxUses != null && row.usesCount >= row.maxUses) return "exhausted";
  return null;
}

export function inviteFailureMessage(reason: InviteValidationFailure): string {
  switch (reason) {
    case "not_found":
      return "That invite code is not valid.";
    case "revoked":
      return "That invite code has been revoked.";
    case "expired":
      return "That invite code has expired.";
    case "exhausted":
      return "That invite code has already been used up.";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

/** Lock and validate an invite inside an open transaction; increments uses_count. */
export async function consumeInviteCode(
  connection: PoolConnection,
  rawCode: string,
): Promise<{ ok: true; inviteId: number } | { ok: false; reason: InviteValidationFailure }> {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteCodeFormat(code)) {
    return { ok: false, reason: "not_found" };
  }

  const [rows] = await connection.query<InviteDbRow[]>(
    `SELECT id, code, created_by_user_id, NULL AS created_by_display_name,
            created_at, max_uses, uses_count, expires_at, revoked_at
     FROM family_invite_codes
     WHERE code = ?
     LIMIT 1
     FOR UPDATE`,
    [code],
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };

  const mapped = mapInvite(row);
  const failure = validateInviteRow(mapped);
  if (failure) return { ok: false, reason: failure };

  await connection.query(
    `UPDATE family_invite_codes SET uses_count = uses_count + 1 WHERE id = ?`,
    [mapped.id],
  );
  return { ok: true, inviteId: mapped.id };
}

/**
 * Idempotent seed of the demo family invite when DEMO_FAMILY_INVITE_CODE is set.
 * Unlimited uses, never expires. Skips when the env var is unset or invalid.
 */
export async function seedDemoFamilyInvite(createdByUserId: number): Promise<void> {
  const raw = process.env.DEMO_FAMILY_INVITE_CODE?.trim() ?? "";
  if (!raw) {
    return;
  }
  const code = normalizeInviteCode(raw);
  if (!isValidInviteCodeFormat(code)) {
    console.warn(
      "[seed] Skipping demo invite: DEMO_FAMILY_INVITE_CODE failed format validation.",
    );
    return;
  }
  const pool = getPool();
  await pool.query(
    `INSERT INTO family_invite_codes (code, created_by_user_id, max_uses, expires_at)
     VALUES (?, ?, NULL, NULL)
     ON DUPLICATE KEY UPDATE code = VALUES(code)`,
    [code, createdByUserId],
  );
}
