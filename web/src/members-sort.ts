import type { MemberSummary } from "./api";

/** Client-side sort for the Members directory list. */
export type MembersSort = "name_asc" | "name_desc" | "cars_desc" | "cars_asc";

export const DEFAULT_MEMBERS_SORT: MembersSort = "name_asc";

export const MEMBERS_SORT_OPTIONS: Array<{ value: MembersSort; label: string }> = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "cars_desc", label: "Most cars" },
  { value: "cars_asc", label: "Least cars" },
];

export function parseMembersSort(raw: string | null | undefined): MembersSort {
  switch (raw) {
    case "name_asc":
    case "name_desc":
    case "cars_desc":
    case "cars_asc":
      return raw;
    default:
      return DEFAULT_MEMBERS_SORT;
  }
}

function memberName(member: Pick<MemberSummary, "displayName">): string {
  return member.displayName.trim().toLocaleLowerCase();
}

export function sortMembers<T extends Pick<MemberSummary, "displayName" | "carCount">>(
  members: T[],
  sort: MembersSort,
): T[] {
  const next = [...members];
  switch (sort) {
    case "name_asc":
      next.sort(
        (a, b) =>
          memberName(a).localeCompare(memberName(b)) || Number(b.carCount) - Number(a.carCount),
      );
      return next;
    case "name_desc":
      next.sort(
        (a, b) =>
          memberName(b).localeCompare(memberName(a)) || Number(b.carCount) - Number(a.carCount),
      );
      return next;
    case "cars_desc":
      next.sort(
        (a, b) =>
          Number(b.carCount) - Number(a.carCount) || memberName(a).localeCompare(memberName(b)),
      );
      return next;
    case "cars_asc":
      next.sort(
        (a, b) =>
          Number(a.carCount) - Number(b.carCount) || memberName(a).localeCompare(memberName(b)),
      );
      return next;
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}
