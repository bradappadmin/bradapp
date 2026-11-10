import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { CompletedTrade, CompletedTradeCar } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { offerAgainHref, offerAgainLabel } from "../trade-history-again";
import {
  filterTradesHistoryByStatus,
  parseTradesHistoryStatusGroup,
  tradeHistoryStatusLabel,
  TRADES_HISTORY_STATUS_OPTIONS,
  type TradesHistoryStatusGroup,
} from "../trades-history-status-filter";

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

function statusBadgeClass(status: CompletedTrade["status"]): string {
  switch (status) {
    case "accepted":
      return "border-lime/40 bg-lime/10 text-lime";
    case "declined":
      return "border-rose/40 bg-rose/10 text-rose";
    case "cancelled":
      return "border-white/20 bg-bay-panel/60 text-steel";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusRowClass(status: CompletedTrade["status"]): string {
  switch (status) {
    case "accepted":
      return "border-lime/30 shadow-[inset_3px_0_0_0_rgba(163,230,53,0.85)]";
    case "declined":
      return "border-rose/35 shadow-[inset_3px_0_0_0_rgba(251,113,133,0.85)]";
    case "cancelled":
      return "border-white/15 shadow-[inset_3px_0_0_0_rgba(226,232,240,0.35)]";
    default: {
      const _exhaustive: never = status;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const statusGroup = parseTradesHistoryStatusGroup(searchParams.get("status"));
  const [trades, setTrades] = useState<CompletedTrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterTradesHistoryByStatus(trades, statusGroup),
    [trades, statusGroup],
  );
  const filtersOn = statusGroup !== "all";

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

  function setStatusGroup(next: TradesHistoryStatusGroup) {
    const params = new URLSearchParams();
    if (next !== "all") params.set("status", next);
    setSearchParams(params, { replace: true });
  }

  function onClearFilters() {
    setStatusGroup("all");
  }

  const completedCount = trades.filter((t) => t.status === "accepted").length;
  const declinedCount = trades.filter(
    (t) => t.status === "declined" || t.status === "cancelled",
  ).length;
  const offered = trades.filter((t) => t.youWere === "offerer").length;
  const acceptedRole = trades.filter((t) => t.youWere === "receiver").length;

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
              Trade history
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
            <p className="mt-4 text-sm leading-relaxed text-steel sm:text-base">
              Resolved free swaps — completed, declined, or cancelled. Newest first. Still zero Brad
              Coins.
            </p>
            {!loading && trades.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Trade history summary">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {completedCount} completed
                </span>
                <span className="rounded-md border border-rose/35 bg-rose/10 px-3 py-1.5 font-display text-xs font-semibold text-rose">
                  {declinedCount} declined
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {offered} offered · {acceptedRole} received
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

        {trades.length > 0 || filtersOn ? (
          <section
            className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
            aria-labelledby="trade-history-filter-heading"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2
                id="trade-history-filter-heading"
                className="font-display text-lg text-mist sm:text-xl"
              >
                Filter status
              </h2>
              <p className="text-xs text-steel">Stays in the URL</p>
            </div>
            <div className="mt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Status</p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter trades by status"
              >
                {TRADES_HISTORY_STATUS_OPTIONS.map((option) => {
                  const active = statusGroup === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusGroup(option.id)}
                      className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                        active
                          ? "border-lime/50 bg-lime/10 text-lime"
                          : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-steel">
                Declined includes cancelled offers.
              </p>
            </div>
            {filtersOn ? (
              <p className="mt-4 text-sm text-steel">
                Showing{" "}
                {!loading ? (
                  <>
                    {visible.length} of {trades.length}{" "}
                    {trades.length === 1 ? "trade" : "trades"}
                  </>
                ) : (
                  "…"
                )}{" "}
                ·{" "}
                <span className="font-display text-lime">
                  {TRADES_HISTORY_STATUS_OPTIONS.find((o) => o.id === statusGroup)?.label}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && trades.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="Empty trade history bay"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No resolved trades yet. Open Trades to offer a free swap, or browse Members for a
              garage to trade with — Offer again shows up here after deals resolve.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/trades"
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Open trades
              </Link>
              <Link
                to="/members"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Browse members
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && trades.length > 0 && filtersOn && visible.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="No matching trade history"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No{" "}
              {statusGroup === "completed"
                ? "completed"
                : statusGroup === "declined"
                  ? "declined"
                  : ""}{" "}
              trades in this filter. Clear the filter to see the full reel — Offer again stays on
              rows with another member.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClearFilters}
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Clear filter
              </button>
              <Link
                to="/trades"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Open trades
              </Link>
              <Link
                to="/members"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Browse members
              </Link>
            </div>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul
            className="bay-rise-delay mt-8 flex flex-col gap-3"
            aria-label="Free card trade history"
          >
            {visible.map((trade) => {
              const role = roleBadge(trade.youWere);
              const againHref = offerAgainHref(trade, user?.id ?? null);
              return (
                <li
                  key={trade.id}
                  className={`play-panel rounded-md border p-4 text-sm sm:p-5 ${statusRowClass(trade.status)}`}
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
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${statusBadgeClass(trade.status)}`}
                        >
                          {tradeHistoryStatusLabel(trade.status)}
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
                  {againHref ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={againHref}
                        className="rounded-md border border-lime/40 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                        aria-label={`Offer again with ${trade.counterpartyName}`}
                      >
                        {offerAgainLabel()}
                      </Link>
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
