import type { StreakMilestone } from "../api";
import { nextStreakHint } from "../win-streak-hint";

export function WinStreakPanel({
  streak,
  milestones,
  lastBonus = 0,
}: {
  streak: number;
  milestones: StreakMilestone[];
  lastBonus?: number;
}) {
  const ordered = [...milestones].sort((a, b) => a.streak - b.streak);
  const hint = nextStreakHint(streak, ordered);

  return (
    <section
      className="play-panel rounded-md border p-4 sm:p-5"
      aria-labelledby="win-streak-heading"
      aria-label="Win streak"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Consecutive wins</p>
          <h2 id="win-streak-heading" className="mt-1 font-display text-lg text-mist sm:text-xl">
            Win streak
          </h2>
        </div>
        <div
          className="inline-flex items-baseline gap-1 rounded-md border border-rose/40 bg-rose/10 px-3 py-2"
          aria-label={`Current win streak ${streak}`}
        >
          <span className="font-display text-xs uppercase tracking-wide text-rose/80">×</span>
          <span className="font-display text-2xl font-semibold leading-none text-rose sm:text-3xl">
            {streak}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-steel">{hint}</p>

      {lastBonus > 0 ? (
        <p className="mt-2 text-sm text-lime">Last match paid +{lastBonus} BC streak bonus.</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Streak bonus thresholds">
        {ordered.map((m) => {
          const reached = streak >= m.streak;
          return (
            <span
              key={m.streak}
              className={
                reached
                  ? "rounded-md border border-lime/40 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime"
                  : "rounded-md border border-white/12 bg-bay-panel/50 px-3 py-1.5 font-display text-xs font-semibold text-mist"
              }
            >
              {m.streak} wins +{m.coins} BC
              {reached ? " · hit" : ""}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-steel">A loss resets the streak; draws keep it.</p>
    </section>
  );
}
