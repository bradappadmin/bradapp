import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { LedgerEntry } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { ledgerDirectionLabel, ledgerReasonLabel } from "../ledger-labels";
import {
  filterLedgerByReasonGroup,
  LEDGER_REASON_GROUP_OPTIONS,
  parseLedgerReasonGroup,
  type LedgerReasonGroup,
} from "../ledger-reason-filter";

export function LedgerPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const reasonGroup = parseLedgerReasonGroup(searchParams.get("group"));
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const signedIn = user;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchLedger(100);
        if (!cancelled) {
          setLedger(res.ledger);
          setBalance(res.balance);
          setUser({ ...signedIn, coinBalance: res.balance });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load ledger");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when signed-in user id changes
  }, [user?.id]);

  const visibleLedger = useMemo(
    () => filterLedgerByReasonGroup(ledger, reasonGroup),
    [ledger, reasonGroup],
  );

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function setReasonGroup(next: LedgerReasonGroup) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") params.delete("group");
        else params.set("group", next);
        return params;
      },
      { replace: true },
    );
  }

  const emptyFiltered =
    !loading && ledger.length > 0 && visibleLedger.length === 0;

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Coin ledger
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Every in and out for your Brad Coin balance — starter, buys, sells, daily bonus, play
              rewards, win streak bonuses, and admin adjusts. No real money.
            </p>
            {!loading && balance != null ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Ledger bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {formatCoins(balance)}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {ledger.length} {ledger.length === 1 ? "entry" : "entries"}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  Personal history
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/account"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Account
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              My cars
            </Link>
          </div>
        </header>

        {balance != null ? (
          <section
            className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
            aria-labelledby="ledger-balance-heading"
          >
            <p className="text-xs uppercase tracking-wide text-steel">Current balance</p>
            <h2
              id="ledger-balance-heading"
              className="mt-2 font-display text-3xl font-semibold text-lime sm:text-4xl"
            >
              {formatCoins(balance)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-steel">
              Live wallet total after the rows below — newest movements first.
            </p>
          </section>
        ) : null}

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && ledger.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center"
            role="status"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">No ledger rows yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              Starter coins, buys, sells, daily bonus, play, and streak bonuses will show up here.
            </p>
            <Link
              to="/cars"
              className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Browse cars
            </Link>
          </div>
        ) : null}

        {ledger.length > 0 ? (
          <section className="bay-rise-delay mt-10" aria-labelledby="ledger-history-heading">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="ledger-history-heading" className="font-display text-xl text-mist">
                History
              </h2>
              <p className="text-sm text-steel">
                {visibleLedger.length} of {ledger.length}{" "}
                {ledger.length === 1 ? "row" : "rows"}
              </p>
            </div>

            <div
              className="mb-4 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter ledger by reason"
            >
              {LEDGER_REASON_GROUP_OPTIONS.map((option) => {
                const active = reasonGroup === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setReasonGroup(option.id)}
                    className={`rounded-md border px-3 py-1.5 font-display text-sm font-semibold transition ${
                      active
                        ? "border-lime/45 bg-lime/10 text-lime"
                        : "border-white/12 bg-bay-panel/50 text-steel hover:border-lime/35 hover:text-lime"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {emptyFiltered ? (
              <div
                className="play-panel rounded-md border px-5 py-10 text-center"
                role="status"
              >
                <p className="font-display text-lg text-mist">Nothing in this filter</p>
                <p className="mt-2 text-sm text-steel">
                  Try All, or another group — this bay still has {ledger.length}{" "}
                  {ledger.length === 1 ? "row" : "rows"} overall.
                </p>
                <button
                  type="button"
                  onClick={() => setReasonGroup("all")}
                  className="mt-5 rounded-md border border-lime/40 px-4 py-2 font-display text-sm font-semibold text-lime transition hover:bg-lime/10"
                >
                  Show all
                </button>
              </div>
            ) : (
              <ul
                className="play-panel divide-y divide-white/10 overflow-hidden rounded-md border"
                aria-label="Brad Coin ledger entries"
              >
                {visibleLedger.map((entry) => {
                  const direction = ledgerDirectionLabel(entry.delta);
                  return (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3.5 text-sm sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-mist">
                          {ledgerReasonLabel(entry.reason)}
                          <span className="ml-2 text-xs uppercase tracking-wide text-steel">
                            {direction}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-steel">
                          {entry.note || "—"}
                          {entry.listingId != null ? (
                            <>
                              {" · "}
                              <Link
                                to={`/cars/${entry.listingId}`}
                                className="text-lime no-underline hover:underline"
                              >
                                Listing #{entry.listingId}
                              </Link>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-steel">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-display font-semibold ${
                            entry.delta >= 0 ? "text-lime" : "text-rose"
                          }`}
                        >
                          {entry.delta >= 0 ? "+" : ""}
                          {entry.delta.toLocaleString()} BC
                        </p>
                        <p className="mt-0.5 text-xs text-steel">
                          → {entry.balanceAfter.toLocaleString()} BC
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        <p className="mt-10 text-sm text-steel">
          <Link to="/" className="text-lime no-underline hover:underline">
            ← Back home
          </Link>
        </p>
      </main>
    </div>
  );
}
