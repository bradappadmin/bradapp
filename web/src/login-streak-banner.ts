import type { DailyLoginStatus, DailyLoginStreakMilestone } from "./api";

export const DEFAULT_LOGIN_STREAK_MILESTONES: DailyLoginStreakMilestone[] = [
  { streak: 3, coins: 15 },
  { streak: 7, coins: 50 },
];

export type LoginStreakProgress =
  | { kind: "next"; streak: number; target: number; coins: number; daysLeft: number }
  | { kind: "complete"; streak: number };

export function resolveLoginStreakMilestones(
  daily: Pick<DailyLoginStatus, "streakMilestones"> | null | undefined,
): DailyLoginStreakMilestone[] {
  const list = daily?.streakMilestones;
  if (list && list.length > 0) return list;
  return DEFAULT_LOGIN_STREAK_MILESTONES;
}

/** Progress toward the next day-3 / day-7 login streak bonus. */
export function loginStreakProgress(
  streak: number,
  milestones: DailyLoginStreakMilestone[] = DEFAULT_LOGIN_STREAK_MILESTONES,
): LoginStreakProgress {
  const current = Math.max(0, Math.trunc(streak));
  const ordered = [...milestones].sort((a, b) => a.streak - b.streak);
  const next = ordered.find((m) => m.streak > current);
  if (!next) {
    return { kind: "complete", streak: current };
  }
  return {
    kind: "next",
    streak: current,
    target: next.streak,
    coins: next.coins,
    daysLeft: next.streak - current,
  };
}

export function loginStreakProgressLabel(progress: LoginStreakProgress): string {
  if (progress.kind === "complete") {
    if (progress.streak <= 0) {
      return "Start a London streak — day 3 +15 BC, day 7 +50 BC";
    }
    return `Login streak ×${progress.streak} · day 3 and day 7 milestones unlocked`;
  }
  if (progress.streak <= 0) {
    return `Claim today to start · day ${progress.target} +${progress.coins} BC`;
  }
  const dayWord = progress.daysLeft === 1 ? "day" : "days";
  return `Login streak ×${progress.streak} · ${progress.daysLeft} more London ${dayWord} to day ${progress.target} (+${progress.coins} BC)`;
}

export function dailyLoginStatusLabel(
  daily: Pick<DailyLoginStatus, "amount" | "claimedToday" | "claimedJustNow" | "claimDate">,
): string {
  if (daily.claimedToday) {
    const just = daily.claimedJustNow ? ` · +${daily.amount} BC` : "";
    return `Today’s +${daily.amount} BC claimed${just}`;
  }
  return `+${daily.amount} BC ready for today`;
}
