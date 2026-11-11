import { describe, expect, it } from "vitest";
import type { FamilyInvite } from "./api";
import {
  ADMIN_INVITES_GROUP_OPTIONS,
  filterAdminInvites,
  inviteLifecycle,
  inviteStatusLabel,
  parseAdminInvitesGroup,
} from "./admin-invites-filter";

const now = Date.parse("2026-11-10T12:00:00.000Z");

function invite(
  partial: Partial<FamilyInvite> & Pick<FamilyInvite, "id" | "code">,
): FamilyInvite {
  return {
    createdByUserId: 1,
    createdByDisplayName: "Brad",
    createdAt: "2026-11-01T00:00:00.000Z",
    maxUses: null,
    usesCount: 0,
    expiresAt: null,
    revokedAt: null,
    ...partial,
  };
}

const rows: FamilyInvite[] = [
  invite({ id: 1, code: "FAMILY-BAY-2026", createdByDisplayName: "Brad" }),
  invite({
    id: 2,
    code: "USED-ONCE",
    maxUses: 1,
    usesCount: 1,
    createdByDisplayName: "Sam Bay",
  }),
  invite({
    id: 3,
    code: "OLD-CODE",
    expiresAt: "2026-01-01T00:00:00.000Z",
    createdByDisplayName: "Napwood",
  }),
  invite({
    id: 4,
    code: "REVOKED-X",
    revokedAt: "2026-11-05T00:00:00.000Z",
    createdByDisplayName: "Brad",
  }),
];

describe("admin-invites-filter", () => {
  it("parses status chips and exposes labels", () => {
    expect(parseAdminInvitesGroup(null)).toBe("all");
    expect(parseAdminInvitesGroup("active")).toBe("active");
    expect(parseAdminInvitesGroup("used")).toBe("used");
    expect(parseAdminInvitesGroup("nope")).toBe("all");
    expect(ADMIN_INVITES_GROUP_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Active",
      "Used/redeemed",
    ]);
  });

  it("classifies lifecycle and filters by code/creator + status", () => {
    expect(inviteStatusLabel(inviteLifecycle(rows[0]!, now))).toBe("Active");
    expect(inviteStatusLabel(inviteLifecycle(rows[1]!, now))).toBe("Used up");
    expect(inviteStatusLabel(inviteLifecycle(rows[2]!, now))).toBe("Expired");
    expect(inviteStatusLabel(inviteLifecycle(rows[3]!, now))).toBe("Revoked");

    expect(filterAdminInvites(rows, "family", "all", now).map((i) => i.id)).toEqual([1]);
    expect(filterAdminInvites(rows, "sam", "all", now).map((i) => i.id)).toEqual([2]);
    expect(filterAdminInvites(rows, "", "active", now).map((i) => i.id)).toEqual([1]);
    expect(filterAdminInvites(rows, "", "used", now).map((i) => i.id)).toEqual([2, 3, 4]);
    expect(filterAdminInvites(rows, "brad", "used", now).map((i) => i.id)).toEqual([4]);
  });
});
