import type { LedgerEntry } from "./api";
import type { LedgerReasonLabel } from "./ledger-labels";

export type LedgerReasonGroup = "all" | "play" | "trades" | "bonuses" | "admin";

export const LEDGER_REASON_GROUP_OPTIONS: Array<{
  id: LedgerReasonGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "play", label: "Play" },
  { id: "trades", label: "Buys/Sells" },
  { id: "bonuses", label: "Bonuses" },
  { id: "admin", label: "Admin" },
];

const GROUP_REASONS: Record<Exclude<LedgerReasonGroup, "all">, LedgerReasonLabel[]> = {
  play: ["play_reward"],
  trades: ["purchase", "sale"],
  bonuses: ["seed", "daily_login", "tt_streak_bonus", "weekly_cup"],
  admin: ["admin_adjust"],
};

export function parseLedgerReasonGroup(raw: string | null): LedgerReasonGroup {
  if (raw === "play" || raw === "trades" || raw === "bonuses" || raw === "admin") {
    return raw;
  }
  return "all";
}

export function ledgerReasonsForGroup(
  group: LedgerReasonGroup,
): LedgerReasonLabel[] | null {
  if (group === "all") return null;
  return GROUP_REASONS[group];
}

export function filterLedgerByReasonGroup(
  entries: LedgerEntry[],
  group: LedgerReasonGroup,
): LedgerEntry[] {
  const reasons = ledgerReasonsForGroup(group);
  if (reasons == null) return entries;
  const allowed = new Set(reasons);
  return entries.filter((entry) => allowed.has(entry.reason));
}
