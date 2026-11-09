import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { LedgerEntry } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { SiteHeader } from "../components/SiteHeader";
import { ledgerDirectionLabel, ledgerReasonLabel } from "../ledger-labels";

export function LedgerPage() {
  const { user, loading: authLoading, setUser } = useAuth();
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

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Brad Coins</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Coin ledger
        </h1>
        <p className="mt-3 max-w-xl text-sm text-steel">
          Every in and out for your balance — starter, buys, sells, daily bonus, play rewards, and
          admin adjusts. No real money.
        </p>

        {balance != null ? (
          <p className="mt-6 font-display text-2xl text-lime">{formatCoins(balance)}</p>
        ) : null}
        {balance != null ? (
          <p className="mt-1 text-xs uppercase tracking-wide text-steel">Current balance</p>
        ) : null}

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && ledger.length === 0 ? (
          <p className="mt-8 text-sm text-steel">No ledger rows yet.</p>
        ) : null}

        {ledger.length > 0 ? (
          <ul
            className="mt-8 divide-y divide-white/10 border-t border-white/10"
            aria-label="Brad Coin ledger entries"
          >
            {ledger.map((entry) => {
              const direction = ledgerDirectionLabel(entry.delta);
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 py-3 text-sm"
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
        ) : null}

        <p className="mt-10 flex flex-wrap gap-4 text-sm text-steel">
          <Link to="/account" className="text-lime no-underline hover:underline">
            Account
          </Link>
          <Link to="/garage" className="text-lime no-underline hover:underline">
            My cars
          </Link>
          <Link to="/" className="text-lime no-underline hover:underline">
            Home
          </Link>
        </p>
      </main>
    </div>
  );
}
