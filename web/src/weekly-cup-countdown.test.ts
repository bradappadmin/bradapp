import { describe, expect, it } from "vitest";
import {
  cupCountdownLabel,
  formatCupCountdown,
  remainingMsUntil,
} from "./weekly-cup-countdown";

describe("weekly-cup-countdown", () => {
  it("computes remaining ms until weekEnd", () => {
    const end = "2026-11-16T00:00:00.000Z";
    const now = Date.parse("2026-11-15T12:00:00.000Z");
    expect(remainingMsUntil(end, now)).toBe(12 * 60 * 60 * 1000);
    expect(remainingMsUntil(end, Date.parse(end))).toBe(0);
    expect(remainingMsUntil(end, Date.parse(end) + 1000)).toBe(0);
    expect(remainingMsUntil("not-a-date", now)).toBe(0);
  });

  it("formats countdown parts with padded units", () => {
    expect(formatCupCountdown(0)).toBe("0s");
    expect(formatCupCountdown(5_000)).toBe("5s");
    expect(formatCupCountdown(65_000)).toBe("1m 05s");
    expect(formatCupCountdown(3_665_000)).toBe("1h 01m 05s");
    expect(formatCupCountdown(90_065_000)).toBe("1d 01h 01m 05s");
  });

  it("labels live countdown and ended week", () => {
    const end = "2026-11-16T00:00:00.000Z";
    expect(cupCountdownLabel(end, Date.parse("2026-11-15T12:00:00.000Z"))).toBe(
      "Ends in 12h 00m 00s",
    );
    expect(cupCountdownLabel(end, Date.parse(end))).toBe("Week ended · next cup starting");
  });
});
