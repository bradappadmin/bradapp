import { afterEach, describe, expect, it } from "vitest";
import {
  ADMIN_STARTING_COINS,
  DAILY_LOGIN_BONUS,
  DEFAULT_MEMBER_STARTING_COINS,
  memberStartingCoins,
  utcClaimDate,
} from "./coins.js";

describe("coin constants", () => {
  const originalEnv = process.env.MEMBER_STARTING_COINS;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.MEMBER_STARTING_COINS;
    else process.env.MEMBER_STARTING_COINS = originalEnv;
  });

  it("defaults member starter coins to 100 and allows env override", () => {
    delete process.env.MEMBER_STARTING_COINS;
    expect(memberStartingCoins()).toBe(DEFAULT_MEMBER_STARTING_COINS);
    expect(DEFAULT_MEMBER_STARTING_COINS).toBe(100);
    expect(ADMIN_STARTING_COINS).toBeGreaterThan(memberStartingCoins());

    process.env.MEMBER_STARTING_COINS = "250";
    expect(memberStartingCoins()).toBe(250);
    process.env.MEMBER_STARTING_COINS = "-5";
    expect(memberStartingCoins()).toBe(DEFAULT_MEMBER_STARTING_COINS);
  });

  it("defines a positive daily login bonus and UTC claim date", () => {
    expect(DAILY_LOGIN_BONUS).toBeGreaterThan(0);
    expect(utcClaimDate(new Date("2026-11-09T23:30:00.000Z"))).toBe("2026-11-09");
  });
});
