/** First-visit tips shown on home after sign-in. Dismissals persist per user in localStorage. */

export type TipId = "cars" | "play" | "trades" | "reviews" | "admin";

export type FirstVisitTip = {
  id: TipId;
  title: string;
  body: string;
  to: string;
};

const ALL_TIPS: FirstVisitTip[] = [
  {
    id: "cars",
    title: "Cars",
    body: "Search real makes and models, then buy with Brad Coins from the catalogue.",
    to: "/cars",
  },
  {
    id: "play",
    title: "Play",
    body: "Put a car up in Top Trumps — face the house or challenge a member.",
    to: "/play",
  },
  {
    id: "trades",
    title: "Trades",
    body: "Offer a free card swap with someone in the bay. No Brad Coins move.",
    to: "/trades",
  },
  {
    id: "reviews",
    title: "Reviews",
    body: "Watch bay reviews — and if you’re Brad or Napwood, record one.",
    to: "/reviews",
  },
  {
    id: "admin",
    title: "Admin",
    body: "Correct accounts, coin balances, cars, and listings from the admin bay.",
    to: "/admin",
  },
];

const TIP_IDS = new Set<TipId>(ALL_TIPS.map((tip) => tip.id));

export function storageKey(userId: number): string {
  return `bradapp:first-visit-tips:v1:${userId}`;
}

export function tipsForRole(role: "super_admin" | "admin" | "member"): FirstVisitTip[] {
  const isAdmin = role === "admin" || role === "super_admin";
  return ALL_TIPS.filter((tip) => tip.id !== "admin" || isAdmin);
}

export function parseDismissed(raw: string | null): TipId[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is TipId => typeof id === "string" && TIP_IDS.has(id as TipId));
  } catch {
    return [];
  }
}

export function loadDismissed(userId: number, storage: Storage = localStorage): TipId[] {
  try {
    return parseDismissed(storage.getItem(storageKey(userId)));
  } catch {
    return [];
  }
}

export function saveDismissed(
  userId: number,
  dismissed: TipId[],
  storage: Storage = localStorage,
): void {
  try {
    storage.setItem(storageKey(userId), JSON.stringify(dismissed));
  } catch {
    // Ignore quota / private-mode failures — tips just reappear this session.
  }
}

export function visibleTips(
  role: "super_admin" | "admin" | "member",
  dismissed: TipId[],
): FirstVisitTip[] {
  const dismissedSet = new Set(dismissed);
  return tipsForRole(role).filter((tip) => !dismissedSet.has(tip.id));
}

export function dismissTip(dismissed: TipId[], tipId: TipId): TipId[] {
  if (dismissed.includes(tipId)) return dismissed;
  return [...dismissed, tipId];
}

export function dismissAllTips(
  role: "super_admin" | "admin" | "member",
  dismissed: TipId[],
): TipId[] {
  const ids = tipsForRole(role).map((tip) => tip.id);
  const next = new Set(dismissed);
  for (const id of ids) next.add(id);
  return [...next];
}
