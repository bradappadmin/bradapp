import type { MatchHistoryItem } from "./api";

function validOpponentId(id: number | null | undefined): id is number {
  return id != null && Number.isFinite(id) && id > 0;
}

/**
 * Whether Open opponent should show for this match history row.
 * PvP only — needs a real opponent who is not the viewer. Hidden for house / self / missing.
 */
export function canOpenMatchOpponent(
  match: Pick<MatchHistoryItem, "mode" | "opponentUserId">,
  viewerUserId: number | null | undefined,
): boolean {
  if (match.mode !== "pvp") return false;
  if (!validOpponentId(match.opponentUserId)) return false;
  if (viewerUserId != null && match.opponentUserId === viewerUserId) return false;
  return true;
}

/**
 * Public garage deep-link for the PvP opponent (`/members/:id`).
 * Returns null when Open opponent should be hidden.
 */
export function matchHistoryOpenOpponentHref(
  match: Pick<MatchHistoryItem, "mode" | "opponentUserId">,
  viewerUserId?: number | null,
): string | null {
  if (!canOpenMatchOpponent(match, viewerUserId ?? null)) return null;
  return `/members/${match.opponentUserId}`;
}

export function matchHistoryOpenOpponentLabel(): string {
  return "Open opponent";
}
