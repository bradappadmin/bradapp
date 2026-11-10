import { describe, expect, it } from "vitest";
import {
  dailyLoginStatusLabel,
  loginStreakProgress,
  loginStreakProgressLabel,
} from "./login-streak-banner";

describe("login-streak-banner helpers", () => {
  it("labels claimed vs ready daily login", () => {
    expect(
      dailyLoginStatusLabel({
        amount: 25,
        claimedToday: true,
        claimedJustNow: true,
        claimDate: "2026-11-10",
      }),
    ).toBe("Today’s +25 BC claimed · +25 BC");
    expect(
      dailyLoginStatusLabel({
        amount: 25,
        claimedToday: true,
        claimedJustNow: false,
        claimDate: "2026-11-10",
      }),
    ).toBe("Today’s +25 BC claimed");
    expect(
      dailyLoginStatusLabel({
        amount: 25,
        claimedToday: false,
        claimedJustNow: false,
        claimDate: "2026-11-10",
      }),
    ).toBe("+25 BC ready for today");
  });

  it("tracks progress toward day 3 and day 7", () => {
    expect(loginStreakProgress(0)).toEqual({
      kind: "next",
      streak: 0,
      target: 3,
      coins: 15,
      daysLeft: 3,
    });
    expect(loginStreakProgress(1)).toEqual({
      kind: "next",
      streak: 1,
      target: 3,
      coins: 15,
      daysLeft: 2,
    });
    expect(loginStreakProgress(3)).toEqual({
      kind: "next",
      streak: 3,
      target: 7,
      coins: 50,
      daysLeft: 4,
    });
    expect(loginStreakProgress(7)).toEqual({ kind: "complete", streak: 7 });
  });

  it("formats progress copy", () => {
    expect(loginStreakProgressLabel(loginStreakProgress(0))).toBe(
      "Claim today to start · day 3 +15 BC",
    );
    expect(loginStreakProgressLabel(loginStreakProgress(2))).toBe(
      "Login streak ×2 · 1 more London day to day 3 (+15 BC)",
    );
    expect(loginStreakProgressLabel(loginStreakProgress(3))).toBe(
      "Login streak ×3 · 4 more London days to day 7 (+50 BC)",
    );
    expect(loginStreakProgressLabel(loginStreakProgress(7))).toBe(
      "Login streak ×7 · day 3 and day 7 milestones unlocked",
    );
  });
});
