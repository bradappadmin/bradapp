import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { LeaderboardEntry } from "../api";
import { useAuth } from "../auth-context";
import { bioSnippet } from "../bio-snippet";
import { formatCoins, listingTitle } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";

function podiumRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return "border-lime/45 bg-lime/15 text-lime";
    case 2:
      return "border-mist/35 bg-white/[0.06] text-mist";
    case 3:
      return "border-rose/40 bg-rose/10 text-rose";
    default:
      return "border-white/10 bg-bay-panel/50 text-steel";
  }
}

function rowPanelClass(rank: number, isYou: boolean): string {
  if (rank === 1) {
    return "border-lime/30 bg-lime/[0.06]";
  }
  if (rank === 2) {
    return "border-white/14 bg-bay-panel/55";
  }
  if (rank === 3) {
    return "border-rose/25 bg-rose/[0.05]";
  }
  if (isYou) {
    return "border-lime/20 bg-bay-panel/45";
  }
  return "border-white/10 bg-bay-panel/35";
}

export function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchLeaderboard();
        if (!cancelled) {
          setEntries(res.entries);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  const topThree = entries.slice(0, 3);

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Brad Coin leaderboard
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Who’s richest in the bay. Ranked by Brad Coin balance; each row shows a highlight car
              from their garage plus Top Trumps wins.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Leaderboard bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Ranked by coins
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {entries.length} {entries.length === 1 ? "member" : "members"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/members"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Members
            </Link>
            <Link
              to="/play"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Play
            </Link>
          </div>
        </header>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        {!loading && topThree.length > 0 ? (
          <section
            className="bay-rise-delay mt-8"
            aria-label="Top three on the podium"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Podium</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {topThree.map((entry) => {
                const isYou = Boolean(user && entry.id === user.id);
                return (
                  <li key={`podium-${entry.id}`}>
                    <Link
                      to={`/members/${entry.id}`}
                      className={`play-panel flex flex-col rounded-md border p-4 no-underline transition hover:border-lime/35 ${rowPanelClass(entry.rank, isYou)}`}
                    >
                      <span
                        className={`inline-flex w-fit rounded-md border px-2.5 py-1 font-display text-xs font-semibold ${podiumRankClass(entry.rank)}`}
                      >
                        #{entry.rank}
                      </span>
                      <p className="mt-3 font-display text-base font-semibold text-mist">
                        {entry.displayName}
                        {isYou ? " (you)" : ""}
                      </p>
                      <p className="mt-1 font-display text-sm text-lime">
                        {formatCoins(entry.coinBalance)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="bay-rise-delay mt-10" aria-labelledby="leaderboard-standings">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="leaderboard-standings" className="font-display text-xl text-mist">
              Standings
            </h2>
            {!loading ? (
              <p className="text-sm text-steel">
                {entries.length} {entries.length === 1 ? "row" : "rows"}
              </p>
            ) : null}
          </div>

          <ol className="flex flex-col gap-3">
            {entries.map((entry) => {
              const isYou = Boolean(user && entry.id === user.id);
              const snippet = bioSnippet(entry.bio);
              const car = entry.highlightCar;
              const carTitle = car
                ? listingTitle({ make: car.make, model: car.model, trimName: car.trimName })
                : null;
              return (
                <li key={entry.id}>
                  <Link
                    to={`/members/${entry.id}`}
                    className={`play-panel group flex items-center gap-3 rounded-md border p-3 no-underline transition hover:border-lime/35 sm:gap-4 sm:p-4 ${rowPanelClass(entry.rank, isYou)}`}
                    aria-label={`${entry.displayName}${isYou ? " (you)" : ""}, rank ${entry.rank}, open garage`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-display text-sm font-semibold sm:h-10 sm:w-10 sm:text-base ${podiumRankClass(entry.rank)}`}
                    >
                      #{entry.rank}
                    </span>

                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-bay-panel/60 sm:h-16 sm:w-28">
                      {car && carTitle ? (
                        <CarVisual
                          colour={car.colour}
                          bodyType={car.bodyType}
                          make={car.make}
                          model={car.model}
                          size="thumb"
                          title={carTitle}
                          className="!h-full !w-full !rounded-none !border-0"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center bg-gradient-to-b from-bay-panel to-bay-deep"
                          aria-hidden
                        >
                          <span className="font-display text-[10px] uppercase tracking-wide text-steel/80">
                            Empty bay
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold text-mist transition group-hover:text-white">
                        {entry.displayName}
                        {isYou ? " (you)" : ""}
                      </p>
                      {snippet ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-mist/85">{snippet}</p>
                      ) : (
                        <p className="mt-0.5 text-sm text-steel">{entry.roleLabel}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-display text-lime">{formatCoins(entry.coinBalance)}</span>
                        <span className="text-steel">
                          {entry.topTrumpsWins} Top Trumps{" "}
                          {entry.topTrumpsWins === 1 ? "win" : "wins"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {!loading && entries.length === 0 ? (
          <div className="play-panel mt-4 rounded-md border px-4 py-5 text-sm text-steel">
            No members yet.
          </div>
        ) : null}
      </main>
    </div>
  );
}
