import { describe, expect, it } from "vitest";
import type { MatchHistoryItem } from "./api";
import {
  filterPlayHistoryByResult,
  parsePlayHistoryResultGroup,
  PLAY_HISTORY_RESULT_OPTIONS,
} from "./play-history-result-filter";

function match(
  partial: Partial<MatchHistoryItem> & Pick<MatchHistoryItem, "id" | "result">,
): MatchHistoryItem {
  return {
    mode: "house",
    category: "bhp",
    createdAt: "2026-11-10T00:00:00.000Z",
    opponentName: "House",
    opponentUserId: null,
    yourCar: {
      listingId: 1,
      make: "Ford",
      model: "Focus",
      trimName: "ST",
      value: 100,
    },
    theirCar: {
      listingId: null,
      make: "VW",
      model: "Golf",
      trimName: "GTI",
      value: 110,
    },
    coinReward: 10,
    youWere: "challenger",
    ...partial,
  };
}

const rows: MatchHistoryItem[] = [
  match({ id: 1, result: "win" }),
  match({ id: 2, result: "loss" }),
  match({ id: 3, result: "draw" }),
  match({ id: 4, result: "win" }),
];

describe("play-history-result-filter", () => {
  it("parses result chips and exposes labels", () => {
    expect(parsePlayHistoryResultGroup(null)).toBe("all");
    expect(parsePlayHistoryResultGroup("wins")).toBe("wins");
    expect(parsePlayHistoryResultGroup("losses")).toBe("losses");
    expect(parsePlayHistoryResultGroup("nope")).toBe("all");
    expect(PLAY_HISTORY_RESULT_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Wins",
      "Losses",
    ]);
  });

  it("filters matches by win or loss (draws only on All)", () => {
    expect(filterPlayHistoryByResult(rows, "all").map((m) => m.id)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(filterPlayHistoryByResult(rows, "wins").map((m) => m.id)).toEqual([1, 4]);
    expect(filterPlayHistoryByResult(rows, "losses").map((m) => m.id)).toEqual([2]);
  });
});
