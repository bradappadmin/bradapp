import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { CompletedTrade } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";

export function TradeHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [trades, setTrades] = useState<CompletedTrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchCompletedTrades(40);
        if (!cancelled) {
          setTrades(res.trades);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load trade history");
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
          <p className="text-xs uppercase tracking-[0.28em] text-steel">
            Free card trades · Midnight garage
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Completed trades
          </h1>
          <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel">
            Accepted swaps — who you traded with and which cars changed hands. Newest first.
          </p>
          <p className="mt-5">
            <Link
              to="/trades"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              ← Back to Trades / Inbox
            </Link>
          </p>
        </header>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && trades.length === 0 ? (
          <div className="play-panel mt-8 rounded-md border p-5">
            <p className="text-sm text-steel">
              No completed trades yet.{" "}
              <Link to="/trades" className="text-lime no-underline hover:underline">
                Open Trades
              </Link>{" "}
              to offer a free swap.
            </p>
          </div>
        ) : null}

        {trades.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3" aria-label="Completed free card trades">
            {trades.map((trade) => (
              <li key={trade.id} className="play-panel rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-display text-mist">
                    with {trade.counterpartyName}
                    <span className="ml-2 rounded border border-lime/40 bg-lime/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-lime">
                      Accepted
                    </span>
                  </p>
                  <p className="text-xs text-steel">
                    {new Date(trade.resolvedAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-steel">You gave</p>
                    <p className="mt-1">
                      <Link
                        to={`/cars/${trade.youGave.listingId}`}
                        className="text-mist no-underline hover:text-lime"
                      >
                        {listingTitle(trade.youGave)}
                      </Link>
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-steel">You got</p>
                    <p className="mt-1">
                      <Link
                        to={`/cars/${trade.youGot.listingId}`}
                        className="text-mist no-underline hover:text-lime"
                      >
                        {listingTitle(trade.youGot)}
                      </Link>
                    </p>
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
