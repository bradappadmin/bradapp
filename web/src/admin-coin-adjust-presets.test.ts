import { describe, expect, it } from "vitest";
import { ADMIN_COIN_ADJUST_PRESETS } from "./admin-coin-adjust-presets";

describe("admin-coin-adjust-presets", () => {
  it("exposes catalogue-scale positive deltas for Brad/Napwood corrections", () => {
    expect([...ADMIN_COIN_ADJUST_PRESETS]).toEqual([25, 50, 100, 250]);
  });
});
