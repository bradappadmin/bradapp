import { describe, expect, it } from "vitest";
import type { ActivityItem } from "./activity.js";

describe("activity item shape", () => {
  it("uses stable kind ids and optional car visuals for feed entries", () => {
    const sample: ActivityItem = {
      id: "purchase-1",
      kind: "purchase",
      createdAt: "2026-11-09T12:00:00.000Z",
      summary: "Alex bought a Ford Focus for 80 BC",
      actorName: "Alex",
      href: "/cars/1",
      car: {
        make: "Ford",
        model: "Focus",
        trimName: "ST",
        bodyType: "Hatchback",
        colour: "Racing Red",
      },
    };
    expect(sample.kind).toBe("purchase");
    expect(sample.id.startsWith("purchase-")).toBe(true);
    expect(sample.car?.make).toBe("Ford");
  });

  it("supports gift kind without a car visual", () => {
    const gift: ActivityItem = {
      id: "gift-9",
      kind: "gift",
      createdAt: "2026-11-10T01:00:00.000Z",
      summary: "Alex gifted 15 BC to Sam",
      actorName: "Alex",
      href: "/members/4",
      car: null,
    };
    expect(gift.kind).toBe("gift");
    expect(gift.car).toBeNull();
  });
});
