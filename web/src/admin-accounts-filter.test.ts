import { describe, expect, it } from "vitest";
import type { AdminUser } from "./api";
import {
  ADMIN_ACCOUNTS_GROUP_OPTIONS,
  filterAdminAccounts,
  parseAdminAccountsGroup,
} from "./admin-accounts-filter";

function user(partial: Partial<AdminUser> & Pick<AdminUser, "id" | "displayName" | "email">): AdminUser {
  return {
    role: "member",
    coinBalance: 100,
    accountStatus: "active",
    ...partial,
  };
}

const rows: AdminUser[] = [
  user({ id: 1, displayName: "Sam Bay", email: "sam@example.com", role: "member" }),
  user({ id: 2, displayName: "Brad", email: "brad@example.com", role: "admin" }),
  user({
    id: 3,
    displayName: "Napwood",
    email: "parent@example.com",
    role: "super_admin",
  }),
  user({
    id: 4,
    displayName: "Frozen Friend",
    email: "frozen@example.com",
    role: "member",
    accountStatus: "frozen",
  }),
];

describe("admin-accounts-filter", () => {
  it("parses group chips and exposes labels", () => {
    expect(parseAdminAccountsGroup(null)).toBe("all");
    expect(parseAdminAccountsGroup("members")).toBe("members");
    expect(parseAdminAccountsGroup("admins")).toBe("admins");
    expect(parseAdminAccountsGroup("frozen")).toBe("frozen");
    expect(parseAdminAccountsGroup("nope")).toBe("all");
    expect(ADMIN_ACCOUNTS_GROUP_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Members",
      "Admins",
      "Frozen",
    ]);
  });

  it("filters by display name or email", () => {
    expect(filterAdminAccounts(rows, "sam", "all").map((u) => u.id)).toEqual([1]);
    expect(filterAdminAccounts(rows, "PARENT@", "all").map((u) => u.id)).toEqual([3]);
  });

  it("filters by role / frozen chips", () => {
    expect(filterAdminAccounts(rows, "", "members").map((u) => u.id)).toEqual([1, 4]);
    expect(filterAdminAccounts(rows, "", "admins").map((u) => u.id)).toEqual([2, 3]);
    expect(filterAdminAccounts(rows, "", "frozen").map((u) => u.id)).toEqual([4]);
  });

  it("combines search and group", () => {
    expect(filterAdminAccounts(rows, "friend", "frozen").map((u) => u.id)).toEqual([4]);
    expect(filterAdminAccounts(rows, "brad", "members")).toEqual([]);
  });
});
