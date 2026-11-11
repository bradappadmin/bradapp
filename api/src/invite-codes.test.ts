import { describe, expect, it } from "vitest";
import {
  DEMO_FAMILY_INVITE_CODE,
  generateInviteCode,
  inviteFailureMessage,
  isValidInviteCodeFormat,
  normalizeInviteCode,
  validateInviteRow,
  type InviteCodeRow,
} from "./invite-codes.js";

function sample(overrides: Partial<InviteCodeRow> = {}): InviteCodeRow {
  return {
    id: 1,
    code: "BAY-TEST",
    createdByUserId: 1,
    createdByDisplayName: "Brad",
    createdAt: "2026-11-09T12:00:00.000Z",
    maxUses: null,
    usesCount: 0,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("invite-codes helpers", () => {
  it("normalizes and validates code format", () => {
    expect(normalizeInviteCode("  family-bay-2026 ")).toBe("FAMILY-BAY-2026");
    expect(isValidInviteCodeFormat(DEMO_FAMILY_INVITE_CODE)).toBe(true);
    expect(isValidInviteCodeFormat("ab")).toBe(false);
    expect(isValidInviteCodeFormat("bad code!")).toBe(false);
    expect(generateInviteCode()).toMatch(/^BAY-[0-9A-F]{8}$/);
  });

  it("flags revoked, expired, and exhausted invites", () => {
    expect(validateInviteRow(sample())).toBeNull();
    expect(validateInviteRow(sample({ revokedAt: "2026-11-01T00:00:00.000Z" }))).toBe("revoked");
    expect(
      validateInviteRow(sample({ expiresAt: "2020-01-01T00:00:00.000Z" }), new Date("2026-11-09")),
    ).toBe("expired");
    expect(validateInviteRow(sample({ maxUses: 2, usesCount: 2 }))).toBe("exhausted");
    expect(validateInviteRow(sample({ maxUses: 2, usesCount: 1 }))).toBeNull();
  });

  it("maps failure messages", () => {
    expect(inviteFailureMessage("not_found")).toMatch(/not valid/i);
    expect(inviteFailureMessage("revoked")).toMatch(/revoked/i);
    expect(inviteFailureMessage("expired")).toMatch(/expired/i);
    expect(inviteFailureMessage("exhausted")).toMatch(/used up/i);
  });
});
