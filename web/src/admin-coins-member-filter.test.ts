import { describe, expect, it } from "vitest";
import type { AdminUser } from "./api";
import {
  ADMIN_COINS_BALANCE_OPTIONS,
  ADMIN_COINS_LOW_BALANCE,
  filterAdminCoinsMembers,
  parseAdminCoinsBalanceGroup,
} from "./admin-coins-member-filter";

function user(
  partial: Partial<AdminUser> & Pick<AdminUser, "id" | "displayName" | "email" | "coinBalance">,
): AdminUser {
  return {
    role: "member",
    accountStatus: "active",
    ...partial,
  };
}

const rows: AdminUser[] = [
  user({ id: 1, displayName: "Sam Bay", email: "sam@example.com", coinBalance: 40 }),
  user({ id: 2, displayName: "Brad", email: "brad@example.com", coinBalance: 500 }),
  user({ id: 3, displayName: "Low Lou", email: "lou@example.com", coinBalance: 99 }),
];

describe("admin-coins-member-filter", () => {
  it("parses balance chips and exposes labels", () => {
    expect(parseAdminCoinsBalanceGroup(null)).toBe("all");
    expect(parseAdminCoinsBalanceGroup("low")).toBe("low");
    expect(parseAdminCoinsBalanceGroup("nope")).toBe("all");
    expect(ADMIN_COINS_LOW_BALANCE).toBe(100);
    expect(ADMIN_COINS_BALANCE_OPTIONS.map((o) => o.label)).toEqual(["All", "Low balance"]);
  });

  it("filters by name/email and low balance", () => {
    expect(filterAdminCoinsMembers(rows, "sam", "all").map((u) => u.id)).toEqual([1]);
    expect(filterAdminCoinsMembers(rows, "", "low").map((u) => u.id)).toEqual([1, 3]);
    expect(filterAdminCoinsMembers(rows, "lou", "low").map((u) => u.id)).toEqual([3]);
    expect(filterAdminCoinsMembers(rows, "brad", "low")).toEqual([]);
  });
});
