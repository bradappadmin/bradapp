import { describe, expect, it } from "vitest";
import {
  canOpenCompareMember,
  compareOpenMemberHref,
  compareOpenMemberLabel,
} from "./compare-open-member";

describe("compare-open-member", () => {
  it("links to the public garage for another member owner", () => {
    expect(canOpenCompareMember(177, 2)).toBe(true);
    expect(compareOpenMemberHref(177, 2)).toBe("/members/177");
    expect(compareOpenMemberLabel()).toBe("Open member");
  });

  it("hides for house / missing owners", () => {
    expect(canOpenCompareMember(null, 2)).toBe(false);
    expect(canOpenCompareMember(0, 2)).toBe(false);
    expect(canOpenCompareMember(undefined, 2)).toBe(false);
    expect(compareOpenMemberHref(null, 2)).toBeNull();
  });

  it("hides for the viewer’s own car", () => {
    expect(canOpenCompareMember(2, 2)).toBe(false);
    expect(compareOpenMemberHref(2, 2)).toBeNull();
  });

  it("still opens for signed-out viewers when a member owns the car", () => {
    expect(canOpenCompareMember(177, null)).toBe(true);
    expect(compareOpenMemberHref(177, null)).toBe("/members/177");
  });
});
