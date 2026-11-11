import { describe, expect, it } from "vitest";
import {
  dismissAllTips,
  dismissTip,
  parseDismissed,
  tipsForRole,
  visibleTips,
} from "./first-visit-tips";

describe("first-visit tips", () => {
  it("includes Admin only for admin roles", () => {
    expect(tipsForRole("member").map((t) => t.id)).toEqual([
      "cars",
      "play",
      "trades",
      "reviews",
    ]);
    expect(tipsForRole("admin").map((t) => t.id)).toContain("admin");
    expect(tipsForRole("super_admin").map((t) => t.id)).toContain("admin");
  });

  it("hides dismissed tips and supports dismiss-all", () => {
    expect(visibleTips("member", ["cars", "play"]).map((t) => t.id)).toEqual([
      "trades",
      "reviews",
    ]);
    expect(dismissTip(["cars"], "play")).toEqual(["cars", "play"]);
    expect(dismissAllTips("member", ["cars"])).toEqual(
      expect.arrayContaining(["cars", "play", "trades", "reviews"]),
    );
  });

  it("parses stored dismissals safely", () => {
    expect(parseDismissed(null)).toEqual([]);
    expect(parseDismissed('["cars","nope"]')).toEqual(["cars"]);
    expect(parseDismissed("not-json")).toEqual([]);
  });
});
