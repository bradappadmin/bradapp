import { describe, expect, it } from "vitest";
import type { MemberSummary } from "./api";
import {
  MEMBERS_CARS_GROUP_OPTIONS,
  filterMembersByCarsGroup,
  parseMembersCarsGroup,
} from "./members-has-cars-filter";

function member(
  partial: Partial<MemberSummary> & Pick<MemberSummary, "id" | "displayName" | "carCount">,
): MemberSummary {
  return {
    bio: null,
    role: "member",
    roleLabel: "Member",
    coinBalance: 100,
    ...partial,
  };
}

const rows: MemberSummary[] = [
  member({ id: 1, displayName: "Sam Bay", carCount: 2 }),
  member({ id: 2, displayName: "Empty Eddy", carCount: 0 }),
  member({ id: 3, displayName: "Jordan Pace", carCount: 1 }),
];

describe("members-has-cars-filter", () => {
  it("parses chips and exposes labels", () => {
    expect(parseMembersCarsGroup(null)).toBe("all");
    expect(parseMembersCarsGroup("has_cars")).toBe("has_cars");
    expect(parseMembersCarsGroup("empty")).toBe("empty");
    expect(parseMembersCarsGroup("nope")).toBe("all");
    expect(MEMBERS_CARS_GROUP_OPTIONS.map((o) => o.label)).toEqual([
      "All",
      "Has cars",
      "Empty bay",
    ]);
  });

  it("filters has cars vs empty bay", () => {
    expect(filterMembersByCarsGroup(rows, "has_cars").map((m) => m.id)).toEqual([1, 3]);
    expect(filterMembersByCarsGroup(rows, "empty").map((m) => m.id)).toEqual([2]);
    expect(filterMembersByCarsGroup(rows, "all")).toHaveLength(3);
  });
});
