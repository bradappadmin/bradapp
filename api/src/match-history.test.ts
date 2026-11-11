import { describe, expect, it } from "vitest";
import type { MatchHistoryItem } from "./match-history.js";

describe("match history shape", () => {
  it("describes a house match win from the challenger view", () => {
    const row: MatchHistoryItem = {
      id: 1,
      mode: "house",
      category: "bhp",
      createdAt: "2026-11-09T12:00:00.000Z",
      opponentName: "House",
      opponentUserId: null,
      yourCar: {
        listingId: 10,
        make: "Ford",
        model: "Focus",
        trimName: "ST",
        value: 280,
      },
      theirCar: {
        listingId: null,
        make: "Porsche",
        model: "911",
        trimName: "GT3",
        value: 200,
      },
      result: "win",
      coinReward: 15,
      youWere: "challenger",
    };
    expect(row.opponentName).toBe("House");
    expect(row.result).toBe("win");
    expect(row.yourCar.listingId).toBe(10);
  });
});
