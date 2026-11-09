import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { MatchHistoryItem } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import {
  formatMatchCarTitle,
  matchResultLabel,
  topTrumpsCategoryLabel,
} from "../match-history-labels";

function resultClass(result: MatchHistoryItem["result"]): string {
  switch (result) {
    case "win":
      return "text-lime";
    case "loss":
      return "text-rose";
    case "draw":
      return "text-mist";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

export function MatchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchTopTrumpsHistory(40);
        if (!cancelled) {
          setMatches(res.matches);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load match history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise">
          <p className="text-xs uppercase tracking-[0.28em] text-steel">Top Trumps · Midnight garage</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Match history
          </h1>
          <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel">
            Past matches — opponent, category, winner, and the cars you both put up. Newest first.
          </p>
          <p className="mt-5">
            <Link
              to="/play"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              ← Back to Play
            </Link>
          </p>
        </header>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && matches.length === 0 ? (
          <div className="play-panel mt-8 rounded-md border p-5">
            <p className="text-sm text-steel">
              No matches yet.{" "}
              <Link to="/play" className="text-lime no-underline hover:underline">
                Play Top Trumps
              </Link>{" "}
              vs the house or a member.
            </p>
          </div>
        ) : null}

        {matches.length > 0 ? (
          <ul
            className="mt-8 flex flex-col gap-3"
            aria-label="Top Trumps match history"
          >
            {matches.map((match) => (
              <li key={match.id} className="play-panel rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-mist">
                      vs {match.opponentName}
                      <span
                        className={`ml-2 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                          match.mode === "house"
                            ? "border-lime/30 text-lime"
                            : "border-rose/35 text-rose"
                        }`}
                      >
                        {match.mode === "house" ? "House" : "Challenge"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-steel">
                      {topTrumpsCategoryLabel(match.category)} ·{" "}
                      {new Date(match.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-semibold ${resultClass(match.result)}`}>
                      {matchResultLabel(match.result)}
                    </p>
                    <p className="mt-0.5 text-xs text-lime">+{formatCoins(match.coinReward)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-steel">Your car</p>
                    <p className="mt-1 text-mist">
                      {match.yourCar.listingId != null ? (
                        <Link
                          to={`/cars/${match.yourCar.listingId}`}
                          className="text-mist no-underline hover:text-lime"
                        >
                          {formatMatchCarTitle(match.yourCar)}
                        </Link>
                      ) : (
                        formatMatchCarTitle(match.yourCar)
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-steel">Value {match.yourCar.value}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-steel">Their car</p>
                    <p className="mt-1 text-mist">
                      {match.theirCar.listingId != null ? (
                        <Link
                          to={`/cars/${match.theirCar.listingId}`}
                          className="text-mist no-underline hover:text-lime"
                        >
                          {formatMatchCarTitle(match.theirCar)}
                        </Link>
                      ) : (
                        formatMatchCarTitle(match.theirCar)
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-steel">Value {match.theirCar.value}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
