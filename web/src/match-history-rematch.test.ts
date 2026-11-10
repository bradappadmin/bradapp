import { describe, expect, it } from "vitest";
import type { MatchHistoryItem } from "./api";
import { matchHistoryRematchHref, matchHistoryRematchLabel } from "./match-history-rematch";

const base: MatchHistoryItem = {
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

describe("match history rematch deep-links", () => {
  it("sends house matches back to plain /play", () => {
    expect(matchHistoryRematchHref(base)).toBe("/play");
    expect(matchHistoryRematchLabel(base)).toBe("Rematch vs house");
  });

  it("deep-links PvP rematches with opponent and theirCar when known", () => {
    const pvp: MatchHistoryItem = {
      ...base,
      mode: "pvp",
      opponentName: "Sam Bay",
      opponentUserId: 177,
      theirCar: {
        listingId: 143,
        make: "BMW",
        model: "M3",
        trimName: "Competition",
        value: 450,
      },
    };
    expect(matchHistoryRematchHref(pvp)).toBe("/play?opponent=177&theirCar=143");
    expect(matchHistoryRematchLabel(pvp)).toBe("Rematch");
  });

  it("omits theirCar when the opposing listing is unknown", () => {
    const pvp: MatchHistoryItem = {
      ...base,
      mode: "pvp",
      opponentName: "Sam Bay",
      opponentUserId: 42,
      theirCar: { ...base.theirCar, listingId: null },
    };
    expect(matchHistoryRematchHref(pvp)).toBe("/play?opponent=42");
  });
});
