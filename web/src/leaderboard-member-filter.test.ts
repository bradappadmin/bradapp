import { describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "./api";
import {
  filterLeaderboardMembers,
  matchesLeaderboardMemberQuery,
} from "./leaderboard-member-filter";

function entry(
  partial: Partial<LeaderboardEntry> &
    Pick<LeaderboardEntry, "id" | "rank" | "displayName">,
): LeaderboardEntry {
  return {
    bio: null,
    role: "member",
    roleLabel: "Member",
    coinBalance: 100,
    topTrumpsWins: 0,
    highlightCar: null,
    ...partial,
  };
}

const rows: LeaderboardEntry[] = [
  entry({ id: 1, rank: 1, displayName: "Bay Friend" }),
  entry({ id: 2, rank: 2, displayName: "Member" }),
  entry({ id: 3, rank: 3, displayName: "Casey Apex" }),
];

describe("leaderboard-member-filter", () => {
  it("matches display names case-insensitively", () => {
    expect(matchesLeaderboardMemberQuery(rows[0]!, "")).toBe(true);
    expect(matchesLeaderboardMemberQuery(rows[0]!, "bay")).toBe(true);
    expect(matchesLeaderboardMemberQuery(rows[0]!, "CASEY")).toBe(false);
  });

  it("filters standings by display name", () => {
    expect(filterLeaderboardMembers(rows, "mem").map((e) => e.id)).toEqual([2]);
    expect(filterLeaderboardMembers(rows, "a").map((e) => e.id)).toEqual([1, 3]);
    expect(filterLeaderboardMembers(rows, "zzzz")).toEqual([]);
  });
});
