import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { CompletedTrade, CompletedTradeCar } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { tradeAgainAction, tradeAgainHref } from "../trade-history-again";

/** History payload has make/model but not paint — Midnight Black keeps studio thumbs on-brand. */
const HISTORY_STUDIO_COLOUR = "Midnight Black";

function roleBadge(youWere: CompletedTrade["youWere"]): { label: string; className: string } {
  switch (youWere) {
    case "offerer":
      return {
        label: "You offered",
        className: "border-lime/35 bg-lime/10 text-lime",
      };
    case "receiver":
      return {
        label: "You accepted",
        className: "border-mist/30 bg-bay-panel/60 text-mist",
      };
    default: {
      const _exhaustive: never = youWere;
      return _exhaustive;
    }
  }
}

function TradeCarThumb({
  car,
  side,
}: {
  car: CompletedTradeCar;
  side: "gave" | "got";
}) {
  const title = listingTitle(car);
  return (
    <Link
      to={`/cars/${car.listingId}`}
      className="flex items-center gap-3 rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2 no-underline transition hover:border-lime/35"
    >
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-bay-deep/50 sm:h-[4.5rem] sm:w-32">
        <CarVisual
          colour={HISTORY_STUDIO_COLOUR}
          make={car.make}
          model={car.model}
          size="thumb"
          title={title}
          className="!h-full !w-full !rounded-none !border-0"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-steel">
          {side === "gave" ? "You gave" : "You got"}
        </p>
        <p className="mt-1 font-display text-sm text-mist">{title}</p>
      </div>
    </Link>
  );
}

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

  const offered = trades.filter((t) => t.youWere === "offerer").length;
  const accepted = trades.filter((t) => t.youWere === "receiver").length;

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">
              Free card trades · Midnight garage
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Completed trades
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
            <p className="mt-4 text-sm leading-relaxed text-steel sm:text-base">
              Accepted swaps — who you traded with and which cars changed hands. Newest first. Still
              zero Brad Coins.
            </p>
            {!loading && trades.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Completed trade summary">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {trades.length} completed
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {offered} offered · {accepted} accepted
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/trades"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              ← Back to Trades
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              My cars
            </Link>
          </div>
        </header>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && trades.length === 0 ? (
          <div className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center">
            <p className="font-display text-lg text-mist">Quiet bay</p>
            <p className="mt-2 text-sm text-steel">
              No completed trades yet. Offer a free swap from Trades.
            </p>
            <Link
              to="/trades"
              className="mt-5 inline-block rounded-md border border-lime/40 px-4 py-2 font-display text-sm font-semibold text-lime no-underline hover:bg-lime/10"
            >
              Open Trades
            </Link>
          </div>
        ) : null}

        {trades.length > 0 ? (
          <ul
            className="bay-rise-delay mt-8 flex flex-col gap-3"
            aria-label="Completed free card trades"
          >
            {trades.map((trade) => {
              const role = roleBadge(trade.youWere);
              const again = tradeAgainAction(trade);
              const againHref = tradeAgainHref(trade);
              return (
                <li
                  key={trade.id}
                  className="play-panel rounded-md border border-lime/30 p-4 text-sm shadow-[inset_3px_0_0_0_rgba(163,230,53,0.85)] sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base text-mist">
                          with {trade.counterpartyName}
                        </p>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${role.className}`}
                        >
                          {role.label}
                        </span>
                        <span className="rounded border border-lime/40 bg-lime/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-lime">
                          Accepted
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-steel">
                        {new Date(trade.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <TradeCarThumb car={trade.youGave} side="gave" />
                    <p
                      className="hidden text-center font-display text-sm font-semibold text-steel sm:block"
                      aria-hidden
                    >
                      ↔
                    </p>
                    <TradeCarThumb car={trade.youGot} side="got" />
                  </div>
                  {again !== "hidden" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {again === "offer" && againHref ? (
                        <Link
                          to={againHref}
                          className="rounded-md border border-lime/40 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                        >
                          Trade again
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="They no longer have that car"
                          className="cursor-not-allowed rounded-md border border-white/10 px-3 py-1.5 font-display text-sm font-semibold text-steel/60"
                        >
                          Trade again
                        </button>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
