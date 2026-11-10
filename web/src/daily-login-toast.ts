import type { DailyLoginStatus } from "./api";

/** Success toast copy when a London-day daily login (and optional streak bonus) lands. */
export function dailyLoginToastMessage(
  daily: Pick<DailyLoginStatus, "amount" | "claimDate"> &
    Partial<Pick<DailyLoginStatus, "streak" | "streakBonusAwarded">>,
): string {
  const streak = daily.streak ?? 0;
  const streakBonus = daily.streakBonusAwarded ?? 0;
  const streakBit = streak > 0 ? ` · streak ×${streak}` : "";
  const bonusBit = streakBonus > 0 ? ` · +${streakBonus} streak BC` : "";
  return `Daily login +${daily.amount} BC${streakBit}${bonusBit} · ${daily.claimDate} (Europe/London).`;
}
