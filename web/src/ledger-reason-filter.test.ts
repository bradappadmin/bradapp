import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "./api";
import {
  filterLedgerByReasonGroup,
  ledgerReasonsForGroup,
  parseLedgerReasonGroup,
} from "./ledger-reason-filter";

function entry(id: number, reason: LedgerEntry["reason"]): LedgerEntry {
  return {
    id,
    delta: 10,
    balanceAfter: 100,
    reason,
    listingId: null,
    note: "",
    createdAt: "2026-11-09T12:00:00.000Z",
  };
}

describe("ledger reason filter", () => {
  it("parses group query values", () => {
    expect(parseLedgerReasonGroup(null)).toBe("all");
    expect(parseLedgerReasonGroup("play")).toBe("play");
    expect(parseLedgerReasonGroup("trades")).toBe("trades");
    expect(parseLedgerReasonGroup("bonuses")).toBe("bonuses");
    expect(parseLedgerReasonGroup("gifts")).toBe("gifts");
    expect(parseLedgerReasonGroup("admin")).toBe("admin");
    expect(parseLedgerReasonGroup("nope")).toBe("all");
  });

  it("maps groups to ledger reasons", () => {
    expect(ledgerReasonsForGroup("all")).toBeNull();
    expect(ledgerReasonsForGroup("play")).toEqual(["play_reward"]);
    expect(ledgerReasonsForGroup("trades")).toEqual(["purchase", "sale"]);
    expect(ledgerReasonsForGroup("gifts")).toEqual(["gift_sent", "gift_received"]);
    expect(ledgerReasonsForGroup("bonuses")).toEqual([
      "seed",
      "daily_login",
      "tt_streak_bonus",
      "weekly_cup",
    ]);
    expect(ledgerReasonsForGroup("admin")).toEqual(["admin_adjust"]);
  });

  it("filters entries by group", () => {
    const rows = [
      entry(1, "play_reward"),
      entry(2, "purchase"),
      entry(3, "daily_login"),
      entry(4, "admin_adjust"),
      entry(5, "sale"),
      entry(6, "gift_sent"),
      entry(7, "gift_received"),
    ];
    expect(filterLedgerByReasonGroup(rows, "all")).toHaveLength(7);
    expect(filterLedgerByReasonGroup(rows, "play").map((e) => e.id)).toEqual([1]);
    expect(filterLedgerByReasonGroup(rows, "trades").map((e) => e.id)).toEqual([2, 5]);
    expect(filterLedgerByReasonGroup(rows, "gifts").map((e) => e.id)).toEqual([6, 7]);
    expect(filterLedgerByReasonGroup(rows, "bonuses").map((e) => e.id)).toEqual([3]);
    expect(filterLedgerByReasonGroup(rows, "admin").map((e) => e.id)).toEqual([4]);
  });
});
