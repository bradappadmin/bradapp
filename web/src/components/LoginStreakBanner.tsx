import { Link } from "react-router-dom";
import type { DailyLoginStatus } from "../api";
import {
  dailyLoginStatusLabel,
  loginStreakProgress,
  loginStreakProgressLabel,
  resolveLoginStreakMilestones,
} from "../login-streak-banner";

type LoginStreakBannerProps = {
  dailyLogin: DailyLoginStatus;
  claimBusy?: boolean;
  onClaim?: () => void;
};

export function LoginStreakBanner({
  dailyLogin,
  claimBusy = false,
  onClaim,
}: LoginStreakBannerProps) {
  const streak = dailyLogin.streak ?? 0;
  const milestones = resolveLoginStreakMilestones(dailyLogin);
  const progress = loginStreakProgress(streak, milestones);
  const status = dailyLoginStatusLabel(dailyLogin);
  const progressLabel = loginStreakProgressLabel(progress);
  const bonusNote =
    (dailyLogin.streakBonusAwarded ?? 0) > 0
      ? ` · +${dailyLogin.streakBonusAwarded} streak BC today`
      : "";

  return (
    <section
      className="play-panel bay-rise-delay mt-10 rounded-md border p-4 sm:p-5"
      aria-label="Daily login and login streak"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-steel">
            Daily login · Europe/London
          </p>
          <h2 className="mt-1 font-display text-lg text-mist sm:text-xl">
            {status}
            {bonusNote}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">{progressLabel}</p>
          <p className="mt-1 text-xs text-steel">
            {dailyLogin.claimDate} · day 3 +15 BC · day 7 +50 BC
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!dailyLogin.claimedToday && onClaim ? (
            <button
              type="button"
              disabled={claimBusy}
              onClick={onClaim}
              className="rounded-md border border-lime/40 bg-lime/10 px-3 py-1.5 font-display text-sm font-semibold text-lime transition hover:bg-lime/15 disabled:opacity-60"
            >
              {claimBusy ? "Claiming…" : `Claim +${dailyLogin.amount} BC`}
            </button>
          ) : null}
          <Link
            to="/ledger"
            className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
          >
            Coin ledger
          </Link>
          <Link
            to="/how-to#daily-login"
            className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
          >
            How to
          </Link>
        </div>
      </div>
    </section>
  );
}
