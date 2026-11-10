import type { LedgerEntry } from "./api";
import { ledgerReasonLabel } from "./ledger-labels";

export function matchesLedgerEntryQuery(entry: LedgerEntry, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    entry.reason,
    ledgerReasonLabel(entry.reason),
    entry.note ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterLedgerByEntryQuery(
  entries: LedgerEntry[],
  q: string,
): LedgerEntry[] {
  return entries.filter((entry) => matchesLedgerEntryQuery(entry, q));
}
