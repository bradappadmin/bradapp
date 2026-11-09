import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { LeaderboardEntry } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
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
            Who’s richest in the bay. Ranked by Brad Coin balance; Top Trumps wins shown for bragging
            rights.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <ol className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {entries.map((entry) => {
            const isYou = user && entry.id === user.id;
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-steel">#{entry.rank}</span>
                  <div>
                    <Link
                      to={`/members/${entry.id}`}
                      className="font-display text-lg font-semibold text-mist no-underline hover:text-white"
                    >
                      {entry.displayName}
                      {isYou ? " (you)" : ""}
                    </Link>
                    <p className="mt-1 text-sm text-steel">{entry.roleLabel}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm sm:justify-end">
                  <span className="font-display text-lime">{formatCoins(entry.coinBalance)}</span>
                  <span className="text-steel">
                    {entry.topTrumpsWins} Top Trumps {entry.topTrumpsWins === 1 ? "win" : "wins"}
                  </span>
                </div>
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
