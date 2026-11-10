import type { LeaderboardEntry } from "./api";

export function matchesLeaderboardMemberQuery(
  entry: LeaderboardEntry,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return entry.displayName.toLowerCase().includes(needle);
}

export function filterLeaderboardMembers(
  entries: LeaderboardEntry[],
  q: string,
): LeaderboardEntry[] {
  return entries.filter((entry) => matchesLeaderboardMemberQuery(entry, q));
}
