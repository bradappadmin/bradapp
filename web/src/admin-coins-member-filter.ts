import type { AdminUser } from "./api";
import { matchesAdminAccountsQuery } from "./admin-accounts-filter";

/** Below starter Brad Coins — useful for spotting thin wallets. */
export const ADMIN_COINS_LOW_BALANCE = 100;

export type AdminCoinsBalanceGroup = "all" | "low";

export const ADMIN_COINS_BALANCE_OPTIONS: Array<{
  id: AdminCoinsBalanceGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "low", label: "Low balance" },
];

export function parseAdminCoinsBalanceGroup(raw: string | null): AdminCoinsBalanceGroup {
  switch (raw) {
    case "low":
      return raw;
    default:
      return "all";
  }
}

export function matchesAdminCoinsBalanceGroup(
  user: AdminUser,
  group: AdminCoinsBalanceGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "low":
      return user.coinBalance < ADMIN_COINS_LOW_BALANCE;
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterAdminCoinsMembers(
  users: AdminUser[],
  q: string,
  group: AdminCoinsBalanceGroup,
): AdminUser[] {
  return users.filter(
    (user) =>
      matchesAdminAccountsQuery(user, q) && matchesAdminCoinsBalanceGroup(user, group),
  );
}
