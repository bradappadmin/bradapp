import { describe, expect, it } from "vitest";
import { activityOpenCarHref, activityOpenCarLabel } from "./activity-open-car";

describe("activity Open car", () => {
  it("links the catalogue when listing id is known", () => {
    expect(activityOpenCarHref(42)).toBe("/cars/42");
    expect(activityOpenCarLabel()).toBe("Open car");
  });

  it("hides when listing id is missing", () => {
    expect(activityOpenCarHref(null)).toBeNull();
    expect(activityOpenCarHref(undefined)).toBeNull();
    expect(activityOpenCarHref(0)).toBeNull();
    expect(activityOpenCarHref(-3)).toBeNull();
  });
});
