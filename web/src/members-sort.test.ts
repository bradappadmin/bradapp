import { describe, expect, it } from "vitest";
import {
  DEFAULT_MEMBERS_SORT,
  MEMBERS_SORT_OPTIONS,
  parseMembersSort,
  sortMembers,
} from "./members-sort";

describe("members-sort", () => {
  it("defaults to Name A–Z and exposes bay labels", () => {
    expect(DEFAULT_MEMBERS_SORT).toBe("name_asc");
    expect(parseMembersSort(null)).toBe("name_asc");
    expect(parseMembersSort("bogus")).toBe("name_asc");
    expect(MEMBERS_SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Name A–Z",
      "Name Z–A",
      "Most cars",
      "Least cars",
    ]);
  });

  it("sorts by display name and car count", () => {
    const members = [
      { displayName: "Sam Bay", carCount: 2 },
      { displayName: "Empty Eddy", carCount: 0 },
      { displayName: "Jordan Pace", carCount: 5 },
    ];

    expect(sortMembers(members, "name_asc").map((m) => m.displayName)).toEqual([
      "Empty Eddy",
      "Jordan Pace",
      "Sam Bay",
    ]);
    expect(sortMembers(members, "name_desc").map((m) => m.displayName)).toEqual([
      "Sam Bay",
      "Jordan Pace",
      "Empty Eddy",
    ]);
    expect(sortMembers(members, "cars_desc").map((m) => m.displayName)).toEqual([
      "Jordan Pace",
      "Sam Bay",
      "Empty Eddy",
    ]);
    expect(sortMembers(members, "cars_asc").map((m) => m.displayName)).toEqual([
      "Empty Eddy",
      "Sam Bay",
      "Jordan Pace",
    ]);
  });
});
