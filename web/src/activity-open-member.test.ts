import { describe, expect, it } from "vitest";
import {
  activityOpenMemberHref,
  activityOpenMemberLabel,
  canOpenActivityMember,
} from "./activity-open-member";

describe("activity Open member", () => {
  it("links to the actor’s public garage when known and not self", () => {
    expect(canOpenActivityMember(12, 2)).toBe(true);
    expect(activityOpenMemberHref(12, 2)).toBe("/members/12");
    expect(activityOpenMemberLabel()).toBe("Open member");
  });

  it("hides when actor is missing, invalid, or the viewer", () => {
    expect(canOpenActivityMember(null, 2)).toBe(false);
    expect(canOpenActivityMember(undefined, 2)).toBe(false);
    expect(canOpenActivityMember(0, 2)).toBe(false);
    expect(canOpenActivityMember(-1, 2)).toBe(false);
    expect(canOpenActivityMember(2, 2)).toBe(false);
    expect(activityOpenMemberHref(null, 2)).toBeNull();
    expect(activityOpenMemberHref(2, 2)).toBeNull();
  });

  it("allows Open member when signed out if the actor id is known", () => {
    expect(canOpenActivityMember(12, null)).toBe(true);
    expect(activityOpenMemberHref(12, null)).toBe("/members/12");
  });
});
