/**
 * Milestone Brad Coin bonuses for consecutive Europe/London daily-login days.
 * Awarded only when the streak lands exactly on the milestone after a claim.
 */
export const LOGIN_STREAK_MILESTONES = [
  { streak: 3, coins: 15 },
  { streak: 7, coins: 50 },
] as const;

export type LoginStreakMilestone = (typeof LOGIN_STREAK_MILESTONES)[number];

/** Shift a YYYY-MM-DD claim date by whole calendar days (date-only arithmetic). */
export function shiftClaimDate(ymd: string, deltaDays: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) {
    throw new Error(`invalid_claim_date:${ymd}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/**
 * Next consecutive login streak for today's London claim date.
 * - Same day again → keep streak (idempotent claim path)
 * - Yesterday claimed → increment
 * - Gap / first claim → reset to 1
 */
export function nextLoginStreak(input: {
  previousStreak: number;
  lastClaimDate: string | null | undefined;
  claimDate: string;
}): number {
  const previous = Math.max(0, Math.trunc(input.previousStreak));
  const last =
    input.lastClaimDate == null || String(input.lastClaimDate).trim() === ""
      ? null
      : String(input.lastClaimDate).slice(0, 10);
  if (last === input.claimDate) {
    return Math.max(previous, 1);
  }
  if (last != null && shiftClaimDate(last, 1) === input.claimDate) {
    return previous + 1;
  }
  return 1;
}

/** Coins awarded when the new streak equals a milestone (else 0). */
export function loginStreakBonusFor(streak: number): number {
  const hit = LOGIN_STREAK_MILESTONES.find((m) => m.streak === streak);
  return hit ? hit.coins : 0;
}

/** Format MySQL DATE / Date / string into YYYY-MM-DD or null. */
export function asClaimDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  return raw.slice(0, 10);
}
