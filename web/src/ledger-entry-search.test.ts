import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "./api";
import { filterLedgerByEntryQuery } from "./ledger-entry-search";

function entry(
  partial: Partial<LedgerEntry> & Pick<LedgerEntry, "id" | "reason" | "note">,
): LedgerEntry {
  return {
    delta: 10,
    balanceAfter: 100,
    listingId: null,
    createdAt: "2026-11-10T00:00:00.000Z",
    ...partial,
  };
}

const rows: LedgerEntry[] = [
  entry({ id: 1, reason: "play_reward", note: "Top Trumps play" }),
  entry({ id: 2, reason: "purchase", note: "Bought listing #9" }),
  entry({ id: 3, reason: "tt_streak_bonus", note: "3-win streak bonus" }),
  entry({ id: 4, reason: "daily_login", note: "Daily login" }),
];

describe("ledger-entry-search", () => {
  it("filters by reason label and note text", () => {
    expect(filterLedgerByEntryQuery(rows, "").map((e) => e.id)).toEqual([1, 2, 3, 4]);
    expect(filterLedgerByEntryQuery(rows, "play").map((e) => e.id)).toEqual([1]);
    expect(filterLedgerByEntryQuery(rows, "buy").map((e) => e.id)).toEqual([2]);
    expect(filterLedgerByEntryQuery(rows, "streak").map((e) => e.id)).toEqual([3]);
    expect(filterLedgerByEntryQuery(rows, "listing #9").map((e) => e.id)).toEqual([2]);
    expect(filterLedgerByEntryQuery(rows, "zzzz")).toEqual([]);
  });
});
