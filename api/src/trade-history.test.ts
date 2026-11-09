import { describe, expect, it } from "vitest";
import type { CompletedTrade } from "./trade-history.js";

describe("completed trade history shape", () => {
  it("describes an accepted swap from the offerer view", () => {
    const row: CompletedTrade = {
      id: 1,
      resolvedAt: "2026-11-09T12:00:00.000Z",
      counterpartyName: "Player B",
      youGave: { listingId: 10, make: "Ford", model: "Focus", trimName: "ST" },
      youGot: { listingId: 11, make: "BMW", model: "M2", trimName: "" },
      youWere: "offerer",
    };
    expect(row.counterpartyName).toBe("Player B");
    expect(row.youGave.make).toBe("Ford");
    expect(row.youGot.model).toBe("M2");
  });
});
