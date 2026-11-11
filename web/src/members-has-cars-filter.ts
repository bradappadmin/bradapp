import type { MemberSummary } from "./api";

export type MembersCarsGroup = "all" | "has_cars" | "empty";

export const MEMBERS_CARS_GROUP_OPTIONS: Array<{
  id: MembersCarsGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "has_cars", label: "Has cars" },
  { id: "empty", label: "Empty bay" },
];

export function parseMembersCarsGroup(raw: string | null): MembersCarsGroup {
  switch (raw) {
    case "has_cars":
    case "empty":
      return raw;
    default:
      return "all";
  }
}

export function matchesMembersCarsGroup(
  member: MemberSummary,
  group: MembersCarsGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "has_cars":
      return member.carCount > 0;
    case "empty":
      return member.carCount === 0;
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterMembersByCarsGroup(
  members: MemberSummary[],
  group: MembersCarsGroup,
): MemberSummary[] {
  if (group === "all") return members;
  return members.filter((member) => matchesMembersCarsGroup(member, group));
}
