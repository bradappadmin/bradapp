import { describe, expect, it } from "vitest";
import {
  ADMIN_STARTING_COINS,
  DAILY_LOGIN_BONUS,
  MEMBER_STARTING_COINS,
  utcClaimDate,
} from "./coins.js";

describe("coin constants", () => {
  it("seeds members with a usable starting balance", () => {
    expect(MEMBER_STARTING_COINS).toBeGreaterThanOrEqual(100);
    expect(ADMIN_STARTING_COINS).toBeGreaterThan(MEMBER_STARTING_COINS);
  });

  it("defines a positive daily login bonus and UTC claim date", () => {
    expect(DAILY_LOGIN_BONUS).toBeGreaterThan(0);
    expect(utcClaimDate(new Date("2026-11-09T23:30:00.000Z"))).toBe("2026-11-09");
  });
});
