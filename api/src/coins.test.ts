import { describe, expect, it } from "vitest";
import { ADMIN_STARTING_COINS, MEMBER_STARTING_COINS } from "./coins.js";

describe("coin constants", () => {
  it("seeds members with a usable starting balance", () => {
    expect(MEMBER_STARTING_COINS).toBeGreaterThanOrEqual(100);
    expect(ADMIN_STARTING_COINS).toBeGreaterThan(MEMBER_STARTING_COINS);
  });
});
