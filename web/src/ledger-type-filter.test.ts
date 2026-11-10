import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "./api";
import {
  filterLedgerByType,
  LEDGER_TYPE_OPTIONS,
  parseLedgerType,
} from "./ledger-type-filter";

function entry(
  id: number,
  reason: LedgerEntry["reason"],
  delta: number,
): LedgerEntry {
  return {
    id,
    delta,
    balanceAfter: 100,
    reason,
    listingId: null,
    note: "",
    createdAt: "2026-11-10T12:00:00.000Z",
  };
}

describe("ledger-type-filter", () => {
  it("parses type query values", () => {
    expect(parseLedgerType(null)).toBe("all");
    expect(parseLedgerType(undefined)).toBe("all");
    expect(parseLedgerType("")).toBe("all");
    expect(parseLedgerType("earn")).toBe("earn");
    expect(parseLedgerType("spend")).toBe("spend");
    expect(parseLedgerType("gift")).toBe("gift");
    expect(parseLedgerType("admin")).toBe("admin");
    expect(parseLedgerType("play")).toBe("all");
  });

  it("exposes All / Earn / Spend / Gift / Admin chips", () => {
    expect(LEDGER_TYPE_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Earn",
      "Spend",
      "Gift",
      "Admin",
    ]);
  });

  it("filters by earn, spend, gift, and admin", () => {
    const rows = [
      entry(1, "play_reward", 15),
      entry(2, "purchase", -50),
      entry(3, "gift_sent", -25),
      entry(4, "gift_received", 25),
      entry(5, "admin_adjust", 100),
      entry(6, "admin_adjust", -10),
      entry(7, "sale", 80),
    ];
    expect(filterLedgerByType(rows, "all")).toHaveLength(7);
    expect(filterLedgerByType(rows, "earn").map((e) => e.id)).toEqual([1, 4, 5, 7]);
    expect(filterLedgerByType(rows, "spend").map((e) => e.id)).toEqual([2, 3, 6]);
    expect(filterLedgerByType(rows, "gift").map((e) => e.id)).toEqual([3, 4]);
    expect(filterLedgerByType(rows, "admin").map((e) => e.id)).toEqual([5, 6]);
  });
});
