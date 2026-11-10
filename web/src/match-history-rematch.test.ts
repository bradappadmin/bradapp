import { describe, expect, it } from "vitest";
import type { MatchHistoryItem } from "./api";
import {
  canMatchHistoryRematch,
  matchHistoryRematchHref,
  matchHistoryRematchLabel,
} from "./match-history-rematch";

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
    expect(canMatchHistoryRematch(base, 2)).toBe(true);
    expect(matchHistoryRematchHref(base, 2)).toBe("/play");
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
    expect(canMatchHistoryRematch(pvp, 2)).toBe(true);
    expect(matchHistoryRematchHref(pvp, 2)).toBe("/play?opponent=177&theirCar=143");
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
    expect(matchHistoryRematchHref(pvp, 2)).toBe("/play?opponent=42");
  });

  it("hides Rematch when the PvP opponent is missing", () => {
    const pvp: MatchHistoryItem = {
      ...base,
      mode: "pvp",
      opponentName: "Unknown",
      opponentUserId: null,
    };
    expect(canMatchHistoryRematch(pvp, 2)).toBe(false);
    expect(matchHistoryRematchHref(pvp, 2)).toBeNull();
  });

  it("hides Rematch when the opponent is the viewer", () => {
    const pvp: MatchHistoryItem = {
      ...base,
      mode: "pvp",
      opponentName: "Member",
      opponentUserId: 2,
      theirCar: { ...base.theirCar, listingId: 9 },
    };
    expect(canMatchHistoryRematch(pvp, 2)).toBe(false);
    expect(matchHistoryRematchHref(pvp, 2)).toBeNull();
    expect(canMatchHistoryRematch(pvp, 99)).toBe(true);
    expect(matchHistoryRematchHref(pvp, 99)).toBe("/play?opponent=2&theirCar=9");
  });
});
