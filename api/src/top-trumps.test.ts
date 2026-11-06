import { describe, expect, it } from "vitest";
import {
  PLAY_COINS,
  WIN_COINS,
  categoryDirection,
  decideWinner,
  rewardForResult,
} from "./top-trumps.js";

describe("top trumps rules", () => {
  it("uses higher-wins for power and top speed", () => {
    expect(categoryDirection("bhp")).toBe("higher");
    expect(categoryDirection("top_speed_mph")).toBe("higher");
    expect(decideWinner("bhp", 500, 300)).toBe("challenger");
    expect(decideWinner("top_speed_mph", 150, 180)).toBe("opponent");
  });

  it("uses lower-wins for 0–60", () => {
    expect(categoryDirection("zero_to_sixty_secs")).toBe("lower");
    expect(decideWinner("zero_to_sixty_secs", 3.2, 4.1)).toBe("challenger");
    expect(decideWinner("zero_to_sixty_secs", 5.0, 4.0)).toBe("opponent");
  });

  it("draws when values match", () => {
    expect(decideWinner("bhp", 200, 200)).toBe("draw");
  });

  it("pays win coins to the winner and play coins otherwise", () => {
    expect(rewardForResult("challenger", "challenger")).toBe(WIN_COINS);
    expect(rewardForResult("opponent", "challenger")).toBe(PLAY_COINS);
    expect(rewardForResult("draw", "challenger")).toBe(PLAY_COINS);
  });
});
