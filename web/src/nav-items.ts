/** Shared primary navigation — same product order on desktop and mobile. */

export type NavAuth = "any" | "required" | "guest" | "admin";

export type NavGroup = "explore" | "garage" | "play" | "account" | "auth";

export type NavBadge = "trades" | "favourites";

export type NavItem = {
  to: string;
  label: string;
  group: NavGroup;
  auth: NavAuth;
  badge?: NavBadge;
};

export const NAV_GROUP_LABELS: Record<Exclude<NavGroup, "auth">, string> = {
  explore: "Explore",
  garage: "Garage",
  play: "Play",
  account: "Account",
};

/**
 * Product order: discover → own → play → account.
 * Desktop and mobile both render this list (filtered by auth).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/cars", label: "Cars", group: "explore", auth: "any" },
  { to: "/reviews", label: "Reviews", group: "explore", auth: "any" },
  { to: "/members", label: "Members", group: "explore", auth: "any" },
  { to: "/leaderboard", label: "Leaderboard", group: "explore", auth: "required" },
  { to: "/garage", label: "My cars", group: "garage", auth: "required" },
  { to: "/favourites", label: "Favourites", group: "garage", auth: "required", badge: "favourites" },
  { to: "/compare", label: "Compare", group: "garage", auth: "any" },
  { to: "/play", label: "Play", group: "play", auth: "any" },
  { to: "/trades", label: "Trades", group: "play", auth: "required", badge: "trades" },
  { to: "/ledger", label: "Ledger", group: "account", auth: "required" },
  { to: "/how-to", label: "How to", group: "account", auth: "any" },
  { to: "/account", label: "Account", group: "account", auth: "required" },
  { to: "/admin", label: "Admin", group: "account", auth: "admin" },
  { to: "/signin", label: "Sign in", group: "auth", auth: "guest" },
  { to: "/signup", label: "Sign up", group: "auth", auth: "guest" },
] as const;

export function visibleNavItems(opts: {
  signedIn: boolean;
  isAdmin: boolean;
}): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    switch (item.auth) {
      case "any":
        return true;
      case "required":
        return opts.signedIn;
      case "guest":
        return !opts.signedIn;
      case "admin":
        return opts.isAdmin;
      default: {
        const _exhaustive: never = item.auth;
        return _exhaustive;
      }
    }
  });
}

export function navItemsByGroup(items: NavItem[]): { group: NavGroup; items: NavItem[] }[] {
  const order: NavGroup[] = ["explore", "garage", "play", "account", "auth"];
  return order
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((section) => section.items.length > 0);
}
