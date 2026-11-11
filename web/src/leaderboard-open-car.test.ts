import { describe, expect, it } from "vitest";
import {
  canOpenLeaderboardCar,
  leaderboardOpenCarAriaLabel,
  leaderboardOpenCarHref,
  leaderboardOpenCarLabel,
} from "./leaderboard-open-car";

describe("leaderboard-open-car", () => {
  it("links to the catalogue listing for a known highlight id", () => {
    expect(canOpenLeaderboardCar(42)).toBe(true);
    expect(leaderboardOpenCarHref(42)).toBe("/cars/42");
    expect(leaderboardOpenCarLabel()).toBe("Open car");
    expect(leaderboardOpenCarAriaLabel("Porsche 911 GT3")).toBe("Open car Porsche 911 GT3");
  });

  it("hides for missing / invalid listing ids", () => {
    expect(canOpenLeaderboardCar(null)).toBe(false);
    expect(canOpenLeaderboardCar(0)).toBe(false);
    expect(canOpenLeaderboardCar(undefined)).toBe(false);
    expect(canOpenLeaderboardCar(Number.NaN)).toBe(false);
    expect(leaderboardOpenCarHref(null)).toBeNull();
    expect(leaderboardOpenCarHref(0)).toBeNull();
  });
});
