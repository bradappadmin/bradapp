import type { MatchHistoryItem } from "./api";

export type PlayHistoryResultGroup = "all" | "wins" | "losses";

export const PLAY_HISTORY_RESULT_OPTIONS: Array<{
  id: PlayHistoryResultGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "wins", label: "Wins" },
  { id: "losses", label: "Losses" },
];

export function parsePlayHistoryResultGroup(
  raw: string | null,
): PlayHistoryResultGroup {
  switch (raw) {
    case "wins":
    case "losses":
      return raw;
    default:
      return "all";
  }
}

export function matchesPlayHistoryResultGroup(
  match: MatchHistoryItem,
  group: PlayHistoryResultGroup,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "wins":
      return match.result === "win";
    case "losses":
      return match.result === "loss";
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterPlayHistoryByResult(
  matches: MatchHistoryItem[],
  group: PlayHistoryResultGroup,
): MatchHistoryItem[] {
  return matches.filter((match) => matchesPlayHistoryResultGroup(match, group));
}
