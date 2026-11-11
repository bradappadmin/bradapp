import { describe, expect, it } from "vitest";
import {
  isoWeekKeyFromYmd,
  londonWallToUtc,
  pickWeeklyCupWinner,
  previousWeekWindow,
  weekWindowContaining,
  type WeeklyStanding,
} from "./weekly-cup.js";

describe("weekly cup week window (Europe/London)", () => {
  it("starts Monday 00:00 London and ends next Monday", () => {
    // Wednesday 2026-11-11 15:00 UTC is still Wednesday afternoon in London (GMT).
    const now = new Date("2026-11-11T15:00:00.000Z");
    const week = weekWindowContaining(now);
    expect(week.weekKey).toBe("2026-W46");
    expect(week.startUtc.toISOString()).toBe(
      londonWallToUtc(2026, 11, 9, 0, 0, 0).toISOString(),
    );
    expect(week.endUtc.toISOString()).toBe(
      londonWallToUtc(2026, 11, 16, 0, 0, 0).toISOString(),
    );
    expect(week.endUtc.getTime()).toBeGreaterThan(week.startUtc.getTime());
  });

  it("previous week is contiguous with the current window", () => {
    const now = new Date("2026-11-11T15:00:00.000Z");
    const current = weekWindowContaining(now);
    const prev = previousWeekWindow(now);
    expect(prev.endUtc.toISOString()).toBe(current.startUtc.toISOString());
    expect(prev.weekKey).toBe("2026-W45");
  });

  it("handles a BST summer Monday midnight", () => {
    // 2026-06-08 is a Monday; 00:00 London is BST (UTC+1) → 2026-06-07T23:00:00Z
    const mondayAfternoon = new Date("2026-06-08T14:00:00.000Z");
    const week = weekWindowContaining(mondayAfternoon);
    expect(week.weekKey).toBe(isoWeekKeyFromYmd(2026, 6, 8));
    expect(week.startUtc.toISOString()).toBe("2026-06-07T23:00:00.000Z");
  });
});

describe("pickWeeklyCupWinner", () => {
  it("returns null when nobody has wins", () => {
    expect(pickWeeklyCupWinner([])).toBeNull();
  });

  it("picks the sole top scorer", () => {
    const standings: WeeklyStanding[] = [
      { userId: 9, displayName: "A", wins: 4, rank: 1 },
      { userId: 3, displayName: "B", wins: 2, rank: 2 },
    ];
    expect(pickWeeklyCupWinner(standings)?.userId).toBe(9);
  });

  it("breaks ties with the lowest user id", () => {
    const standings: WeeklyStanding[] = [
      { userId: 12, displayName: "High", wins: 3, rank: 1 },
      { userId: 4, displayName: "Low", wins: 3, rank: 2 },
      { userId: 7, displayName: "Mid", wins: 3, rank: 3 },
    ];
    expect(pickWeeklyCupWinner(standings)?.userId).toBe(4);
  });
});
