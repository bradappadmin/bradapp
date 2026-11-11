import type { CompletedTrade, TradeHistoryStatus } from "./api";

export type TradesHistoryStatusGroup = "all" | "completed" | "declined";

export const TRADES_HISTORY_STATUS_OPTIONS: Array<{
  id: TradesHistoryStatusGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "declined", label: "Declined" },
];

export function parseTradesHistoryStatusGroup(
  raw: string | null,
): TradesHistoryStatusGroup {
  switch (raw) {
    case "completed":
    case "declined":
      return raw;
    default:
      return "all";
  }
}

export function tradeHistoryStatusLabel(status: TradeHistoryStatus): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function matchesTradesHistoryStatusGroup(
  trade: CompletedTrade,
  group: TradesHistoryStatusGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "completed":
      return trade.status === "accepted";
    case "declined":
      // Cancelled offers sit with Declined on this chip (non-completed).
      return trade.status === "declined" || trade.status === "cancelled";
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterTradesHistoryByStatus(
  trades: CompletedTrade[],
  group: TradesHistoryStatusGroup,
): CompletedTrade[] {
  return trades.filter((trade) => matchesTradesHistoryStatusGroup(trade, group));
}
