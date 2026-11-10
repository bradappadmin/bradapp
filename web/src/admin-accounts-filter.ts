import type { AdminUser } from "./api";

export type AdminAccountsGroup = "all" | "members" | "admins" | "frozen";

export const ADMIN_ACCOUNTS_GROUP_OPTIONS: Array<{
  id: AdminAccountsGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "members", label: "Members" },
  { id: "admins", label: "Admins" },
  { id: "frozen", label: "Frozen" },
];

export function parseAdminAccountsGroup(raw: string | null): AdminAccountsGroup {
  switch (raw) {
    case "members":
    case "admins":
    case "frozen":
      return raw;
    default:
      return "all";
  }
}

export function matchesAdminAccountsQuery(user: AdminUser, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    user.displayName.toLowerCase().includes(needle) ||
    user.email.toLowerCase().includes(needle)
  );
}

export function matchesAdminAccountsGroup(
  user: AdminUser,
  group: AdminAccountsGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "members":
      return user.role === "member";
    case "admins":
      return user.role === "admin" || user.role === "super_admin";
    case "frozen":
      return user.accountStatus === "frozen";
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterAdminAccounts(
  users: AdminUser[],
  q: string,
  group: AdminAccountsGroup,
): AdminUser[] {
  return users.filter(
    (user) => matchesAdminAccountsQuery(user, q) && matchesAdminAccountsGroup(user, group),
  );
}
