import { describe, expect, it } from "vitest";
import {
  canOpenMatchOpponent,
  matchHistoryOpenOpponentHref,
  matchHistoryOpenOpponentLabel,
} from "./match-history-open-opponent";

describe("match history Open opponent", () => {
  it("links the PvP opponent garage when known", () => {
    expect(
      matchHistoryOpenOpponentHref(
        { mode: "pvp", opponentUserId: 177 },
        2,
      ),
    ).toBe("/members/177");
    expect(matchHistoryOpenOpponentLabel()).toBe("Open opponent");
    expect(canOpenMatchOpponent({ mode: "pvp", opponentUserId: 177 }, 2)).toBe(true);
  });

  it("hides for house, missing, or self", () => {
    expect(
      matchHistoryOpenOpponentHref({ mode: "house", opponentUserId: null }, 2),
    ).toBeNull();
    expect(
      matchHistoryOpenOpponentHref({ mode: "pvp", opponentUserId: null }, 2),
    ).toBeNull();
    expect(
      matchHistoryOpenOpponentHref({ mode: "pvp", opponentUserId: 0 }, 2),
    ).toBeNull();
    expect(
      matchHistoryOpenOpponentHref({ mode: "pvp", opponentUserId: 2 }, 2),
    ).toBeNull();
    expect(canOpenMatchOpponent({ mode: "house", opponentUserId: null }, 2)).toBe(false);
  });
});
