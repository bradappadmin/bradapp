import { describe, expect, it } from "vitest";
import { dailyLoginToastMessage } from "./daily-login-toast";

describe("dailyLoginToastMessage", () => {
  it("includes streak and milestone bonus when awarded", () => {
    expect(
      dailyLoginToastMessage({
        amount: 25,
        claimDate: "2026-11-10",
        streak: 3,
        streakBonusAwarded: 15,
      }),
    ).toBe(
      "Daily login +25 BC · streak ×3 · +15 streak BC · 2026-11-10 (Europe/London).",
    );
  });

  it("includes streak without bonus on ordinary days", () => {
    expect(
      dailyLoginToastMessage({
        amount: 25,
        claimDate: "2026-11-09",
        streak: 2,
        streakBonusAwarded: 0,
      }),
    ).toBe("Daily login +25 BC · streak ×2 · 2026-11-09 (Europe/London).");
  });
});
