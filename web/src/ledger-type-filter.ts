import type { LedgerEntry } from "./api";

/** Brad Coin ledger flow type — chip filter on `/ledger`. */
export type LedgerType = "all" | "earn" | "spend" | "gift" | "admin";

export const LEDGER_TYPE_OPTIONS: Array<{ id: LedgerType; label: string }> = [
  { id: "all", label: "All" },
  { id: "earn", label: "Earn" },
  { id: "spend", label: "Spend" },
  { id: "gift", label: "Gift" },
  { id: "admin", label: "Admin" },
];

export function parseLedgerType(raw: string | null | undefined): LedgerType {
  switch (raw) {
    case "earn":
    case "spend":
    case "gift":
    case "admin":
      return raw;
    default:
      return "all";
  }
}

export function filterLedgerByType(entries: LedgerEntry[], type: LedgerType): LedgerEntry[] {
  switch (type) {
    case "all":
      return entries;
    case "earn":
      return entries.filter((entry) => entry.delta > 0);
    case "spend":
      return entries.filter((entry) => entry.delta < 0);
    case "gift":
      return entries.filter(
        (entry) => entry.reason === "gift_sent" || entry.reason === "gift_received",
      );
    case "admin":
      return entries.filter((entry) => entry.reason === "admin_adjust");
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
