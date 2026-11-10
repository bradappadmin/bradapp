import { Link } from "react-router-dom";
import type { WeeklyCupSnapshot } from "../api";

export function WeeklyCupPanel({
  cup,
  compact = false,
  viewerId,
}: {
  cup: WeeklyCupSnapshot;
  compact?: boolean;
  viewerId?: number | null;
}) {
  const top = cup.standings.slice(0, compact ? 5 : 10);
  const prev = cup.previousAward;

  return (
    <section
      className="play-panel rounded-md border p-4 sm:p-5"
      aria-labelledby="weekly-cup-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">This week</p>
          <h2 id="weekly-cup-heading" className="mt-1 font-display text-lg text-mist sm:text-xl">
            Top Trumps cup
          </h2>
        </div>
        <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
          {cup.weekKey} · +{cup.prizeAmount} BC
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-steel">
        House and PvP wins count for the Europe/London week. Last week’s top scorer (lowest id on a
        tie) gets {cup.prizeAmount} Brad Coins once.
      </p>

      {prev.winnerUserId != null && prev.prizeAmount > 0 ? (
        <p className="mt-3 text-sm text-mist">
          Last week ({prev.weekKey}):{" "}
          <Link
            to={`/members/${prev.winnerUserId}`}
            className="font-display text-lime no-underline hover:underline"
          >
            {prev.displayName ?? `Member #${prev.winnerUserId}`}
          </Link>{" "}
          · {prev.wins} {prev.wins === 1 ? "win" : "wins"} · +{prev.prizeAmount} BC
        </p>
      ) : (
        <p className="mt-3 text-sm text-steel">
          Last week ({prev.weekKey}): no cup winner yet — play to put yourself on the board.
        </p>
      )}

      {top.length === 0 ? (
        <p className="mt-4 text-sm text-steel">No wins in this London week yet. Play a match.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-2" aria-label="This week Top Trumps cup standings">
          {top.map((row) => {
            const isYou = viewerId != null && row.userId === viewerId;
            return (
              <li
                key={row.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-bay-panel/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-display text-steel">#{row.rank}</span>{" "}
                  <Link
                    to={`/members/${row.userId}`}
                    className="font-display text-mist no-underline hover:text-lime"
                  >
                    {row.displayName}
                    {isYou ? " (you)" : ""}
                  </Link>
                </div>
                <span className="font-display text-lime">
                  {row.wins} {row.wins === 1 ? "win" : "wins"}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {compact ? (
        <p className="mt-4 text-sm text-steel">
          Full bay wealth ranks live on the{" "}
          <Link to="/leaderboard" className="text-lime no-underline hover:underline">
            leaderboard
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
