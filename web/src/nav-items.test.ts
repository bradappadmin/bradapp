import { describe, expect, it } from "vitest";
import { navItemsByGroup, NAV_ITEMS, visibleNavItems } from "./nav-items";

describe("nav-items product order", () => {
  it("lists explore before garage before play before account", () => {
    const labels = NAV_ITEMS.filter((i) => i.auth !== "guest").map((i) => i.label);
    expect(labels.indexOf("Cars")).toBeLessThan(labels.indexOf("My cars"));
    expect(labels.indexOf("My cars")).toBeLessThan(labels.indexOf("Play"));
    expect(labels.indexOf("Play")).toBeLessThan(labels.indexOf("Ledger"));
    expect(labels.indexOf("Compare")).toBeGreaterThan(labels.indexOf("Favourites"));
    expect(labels.indexOf("How to")).toBeGreaterThan(labels.indexOf("Ledger"));
  });

  it("filters guest vs signed-in vs admin the same for desktop and mobile", () => {
    const guest = visibleNavItems({ signedIn: false, isAdmin: false }).map((i) => i.label);
    expect(guest).toEqual([
      "Cars",
      "Reviews",
      "Members",
      "Compare",
      "Play",
      "How to",
      "Sign in",
      "Sign up",
    ]);

    const member = visibleNavItems({ signedIn: true, isAdmin: false }).map((i) => i.label);
    expect(member).toEqual([
      "Cars",
      "Reviews",
      "Members",
      "Leaderboard",
      "My cars",
      "Favourites",
      "Compare",
      "Play",
      "Trades",
      "Ledger",
      "How to",
      "Account",
    ]);
    expect(member).not.toContain("Admin");
    expect(member).not.toContain("Sign in");

    const admin = visibleNavItems({ signedIn: true, isAdmin: true }).map((i) => i.label);
    expect(admin[admin.length - 1]).toBe("Admin");
  });

  it("groups mobile sections in product order", () => {
    const sections = navItemsByGroup(
      visibleNavItems({ signedIn: true, isAdmin: false }),
    ).map((s) => s.group);
    expect(sections).toEqual(["explore", "garage", "play", "account"]);
  });
});
