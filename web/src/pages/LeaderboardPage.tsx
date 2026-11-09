import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { LeaderboardEntry } from "../api";
import { useAuth } from "../auth-context";
import { bioSnippet } from "../bio-snippet";
import { formatCoins, listingTitle } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { SiteHeader } from "../components/SiteHeader";

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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Brad Coin leaderboard</h1>
          <p className="mt-2 text-sm text-steel">
            Who’s richest in the bay. Ranked by Brad Coin balance; each row shows a highlight car
            from their garage (highest Brad Coin price) plus Top Trumps wins.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <ol className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {entries.map((entry) => {
            const isYou = user && entry.id === user.id;
            const snippet = bioSnippet(entry.bio);
            const car = entry.highlightCar;
            const carTitle = car
              ? listingTitle({ make: car.make, model: car.model, trimName: car.trimName })
              : null;
            return (
              <li key={entry.id} className="py-3.5">
                <Link
                  to={`/members/${entry.id}`}
                  className="group flex items-center gap-3 no-underline sm:gap-4"
                  aria-label={`${entry.displayName}${isYou ? " (you)" : ""}, rank ${entry.rank}, open garage`}
                >
                  <span className="w-8 shrink-0 font-display text-lg text-steel sm:w-10">
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

        {!loading && entries.length === 0 ? (
          <p className="mt-4 text-sm text-steel">No members yet.</p>
        ) : null}
      </main>
    </div>
  );
}
