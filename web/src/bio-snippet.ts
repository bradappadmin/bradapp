/** Short public bio preview for dense lists (leaderboard, etc.). */
export function bioSnippet(bio: string | null | undefined, maxLength = 90): string | null {
  if (!bio) return null;
  const trimmed = bio.trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trimEnd();
  return `${cut || trimmed.slice(0, maxLength - 1)}…`;
}
