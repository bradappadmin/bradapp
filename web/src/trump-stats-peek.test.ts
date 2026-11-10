import { describe, expect, it } from "vitest";
import { trumpStatsPeek } from "./trump-stats-peek";

describe("trumpStatsPeek", () => {
  it("formats Power, 0–60, and Top speed like Play categories", () => {
    expect(
      trumpStatsPeek({ bhp: 502, zeroToSixtySecs: 3.2, topSpeedMph: 198 }),
    ).toEqual([
      { id: "bhp", label: "Power", value: "502" },
      { id: "zero_to_sixty_secs", label: "0–60", value: "3.2s" },
      { id: "top_speed_mph", label: "Top speed", value: "198 mph" },
    ]);
  });

  it("omits missing stats", () => {
    expect(trumpStatsPeek({ bhp: 280 })).toEqual([
      { id: "bhp", label: "Power", value: "280" },
    ]);
    expect(trumpStatsPeek({})).toEqual([]);
    expect(trumpStatsPeek({ bhp: null, topSpeedMph: undefined })).toEqual([]);
  });
});
