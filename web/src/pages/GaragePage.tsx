import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, LedgerEntry } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins, formatMileage, listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function GaragePage() {
  const { user, loading: authLoading, setUser, refresh } = useAuth();
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellPrices, setSellPrices] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    const [garage, wallet] = await Promise.all([api.fetchGarage(), api.fetchWallet()]);
    setCars(garage.cars);
    setLedger(wallet.ledger);
    if (user) {
      setUser({ ...user, coinBalance: wallet.balance });
    }
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load garage");
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

  async function onSell(event: FormEvent, carId: number) {
    event.preventDefault();
    const price = Number(sellPrices[carId]);
    if (!Number.isFinite(price) || price < 1) {
      setError("Enter a coin price of at least 1");
      return;
    }
    setBusyId(carId);
    setError(null);
    try {
      await api.sellListing(carId, Math.trunc(price));
      await reload();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not list for sale");
    } finally {
      setBusyId(null);
    }
  }

  async function onUnlist(carId: number) {
    setBusyId(carId);
    setError(null);
    try {
      await api.unlistListing(carId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlist");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">My garage</h1>
          <p className="mt-2 text-sm text-steel">
            Cars you own, and your Brad Coin ledger. No real money leaves this bay.
          </p>
          {user ? (
            <p className="mt-4 font-display text-2xl text-lime">{formatCoins(user.coinBalance)}</p>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <section className="mt-10">
          <h2 className="font-display text-xl text-mist">Your cars</h2>
          {cars.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">
              Empty bay.{" "}
              <Link to="/cars" className="text-lime no-underline hover:underline">
                Search cars
              </Link>{" "}
              to buy one with Brad Coins.
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {cars.map((car) => (
              <li key={car.id} className="py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      to={`/cars/${car.id}`}
                      className="font-display text-lg font-semibold text-mist no-underline hover:text-white"
                    >
                      {listingTitle(car)}
                    </Link>
                    <p className="mt-1 text-sm text-steel">
                      {car.year} · {car.colour} · {formatMileage(car.mileage)} · {car.status}
                    </p>
                    <p className="mt-1 text-sm text-steel">Listed at {formatCoins(car.coinPrice)}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    {car.status === "owned" ? (
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => void onSell(e, car.id)}
                      >
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                          Sale price
                          <input
                            className="w-28 rounded-md border border-white/10 bg-bay-panel px-2 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                            type="number"
                            min={1}
                            value={sellPrices[car.id] ?? String(car.coinPrice)}
                            onChange={(e) =>
                              setSellPrices((prev) => ({ ...prev, [car.id]: e.target.value }))
                            }
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={busyId === car.id}
                          className="rounded-md bg-rose px-4 py-2 font-display text-sm font-semibold text-white disabled:opacity-60"
                        >
                          List for sale
                        </button>
                      </form>
                    ) : null}
                    {car.status === "available" ? (
                      <button
                        type="button"
                        disabled={busyId === car.id}
                        onClick={() => void onUnlist(car.id)}
                        className="rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist hover:border-lime/40 hover:text-lime disabled:opacity-60"
                      >
                        Unlist
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl text-mist">Coin ledger</h2>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="text-mist">{entry.reason.replace("_", " ")}</p>
                  <p className="text-xs text-steel">{entry.note || new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <p className={entry.delta >= 0 ? "text-lime" : "text-rose"}>
                  {entry.delta >= 0 ? "+" : ""}
                  {entry.delta} → {entry.balanceAfter}
                </p>
              </li>
            ))}
          </ul>
          {ledger.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">No ledger rows yet.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
