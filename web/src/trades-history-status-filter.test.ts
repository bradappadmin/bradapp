import { describe, expect, it } from "vitest";
import type { CompletedTrade } from "./api";
import {
  filterTradesHistoryByStatus,
  parseTradesHistoryStatusGroup,
  tradeHistoryStatusLabel,
  TRADES_HISTORY_STATUS_OPTIONS,
} from "./trades-history-status-filter";

function trade(
  partial: Partial<CompletedTrade> & Pick<CompletedTrade, "id" | "status">,
): CompletedTrade {
  return {
    resolvedAt: "2026-11-10T00:00:00.000Z",
    counterpartyName: "Sam Bay",
    counterpartyUserId: 10,
    theirCarListingId: 1,
    theirCarAvailable: partial.status === "accepted",
    youWere: "offerer",
    youGave: { listingId: 1, make: "Ford", model: "Focus", trimName: "ST" },
    youGot: { listingId: 2, make: "BMW", model: "M3", trimName: "" },
    ...partial,
  };
}

const rows: CompletedTrade[] = [
  trade({ id: 1, status: "accepted" }),
  trade({ id: 2, status: "declined" }),
  trade({ id: 3, status: "cancelled" }),
  trade({ id: 4, status: "accepted" }),
];

describe("trades-history-status-filter", () => {
  it("parses status chips and labels", () => {
    expect(parseTradesHistoryStatusGroup(null)).toBe("all");
    expect(parseTradesHistoryStatusGroup("completed")).toBe("completed");
    expect(parseTradesHistoryStatusGroup("declined")).toBe("declined");
    expect(parseTradesHistoryStatusGroup("nope")).toBe("all");
    expect(TRADES_HISTORY_STATUS_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Completed",
      "Declined",
    ]);
    expect(tradeHistoryStatusLabel("accepted")).toBe("Accepted");
    expect(tradeHistoryStatusLabel("declined")).toBe("Declined");
    expect(tradeHistoryStatusLabel("cancelled")).toBe("Cancelled");
  });

  it("filters completed vs declined/cancelled", () => {
    expect(filterTradesHistoryByStatus(rows, "all").map((t) => t.id)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(filterTradesHistoryByStatus(rows, "completed").map((t) => t.id)).toEqual([
      1, 4,
    ]);
    expect(filterTradesHistoryByStatus(rows, "declined").map((t) => t.id)).toEqual([
      2, 3,
    ]);
  });
});
