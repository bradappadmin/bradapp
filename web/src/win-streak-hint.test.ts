import { describe, expect, it } from "vitest";
import { nextStreakHint } from "./win-streak-hint";

const milestones = [
  { streak: 3, coins: 15 },
  { streak: 5, coins: 40 },
];

describe("nextStreakHint", () => {
  it("points at the first milestone from a cold streak", () => {
    expect(nextStreakHint(0, milestones)).toBe("Win 3 in a row for +15 BC.");
  });

  it("counts remaining wins to the next bonus", () => {
    expect(nextStreakHint(2, milestones)).toBe("1 more win for +15 BC (3-win bonus).");
    expect(nextStreakHint(3, milestones)).toBe("2 more wins for +40 BC (5-win bonus).");
  });

  it("notes peak after the last milestone", () => {
    expect(nextStreakHint(5, milestones)).toMatch(/Peak streak bonuses/i);
  });
});
