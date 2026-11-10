import type { StreakMilestone } from "./api";

/** Short copy for how many wins remain until the next streak bonus. */
export function nextStreakHint(streak: number, milestones: StreakMilestone[]): string {
  const ordered = [...milestones].sort((a, b) => a.streak - b.streak);
  const next = ordered.find((m) => m.streak > streak);
  if (!next) {
    if (ordered.length === 0) {
      return "A loss resets the streak; draws keep it.";
    }
    return "Peak streak bonuses unlocked — keep winning; a loss resets.";
  }
  const need = next.streak - streak;
  if (streak <= 0) {
    return `Win ${next.streak} in a row for +${next.coins} BC.`;
  }
  return `${need} more ${need === 1 ? "win" : "wins"} for +${next.coins} BC (${next.streak}-win bonus).`;
}
