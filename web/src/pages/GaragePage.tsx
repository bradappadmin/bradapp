import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, LedgerEntry, PurchasedCar, SoldCar } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { badgeForStatus } from "../car-visuals";
import { CarCard } from "../components/CarCard";
import { SiteHeader } from "../components/SiteHeader";
import { sumGarageValue } from "../garage-value";

export function GaragePage() {
  const { user, loading: authLoading, setUser, refresh } = useAuth();
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [sales, setSales] = useState<SoldCar[]>([]);
  const [purchases, setPurchases] = useState<PurchasedCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellPrices, setSellPrices] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    const [garage, wallet, sold, bought] = await Promise.all([
      api.fetchGarage(),
      api.fetchWallet(),
      api.fetchSoldHistory(),
      api.fetchPurchaseHistory(),
    ]);
    setCars(garage.cars);
    setTotalValue(
      typeof garage.totalValue === "number" ? garage.totalValue : sumGarageValue(garage.cars),
    );
    setLedger(wallet.ledger);
    setSales(sold.sales);
    setPurchases(bought.purchases);
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

  async function onListOrUpdatePrice(event: FormEvent, car: GarageCar) {
    event.preventDefault();
    const price = Number(sellPrices[car.id] ?? car.coinPrice);
    if (!Number.isFinite(price) || price < 1) {
      setError("Enter a Brad Coin price of at least 1");
      return;
    }
    setBusyId(car.id);
    setError(null);
    setNotice(null);
    try {
      await api.sellListing(car.id, Math.trunc(price));
      await reload();
      await refresh();
      setNotice(
        car.status === "available"
          ? `Updated asking price to ${formatCoins(Math.trunc(price))}.`
          : `Listed for sale at ${formatCoins(Math.trunc(price))}. Other members can buy it from Cars.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update listing");
    } finally {
      setBusyId(null);
    }
  }

  async function onUnlist(carId: number) {
    setBusyId(carId);
    setError(null);
    setNotice(null);
    try {
      await api.unlistListing(carId);
      await reload();
      setNotice("Unlisted — car is back in your garage only.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlist");
    } finally {
      setBusyId(null);
    }
  }

  const forSaleCount = cars.filter((c) => c.status === "available").length;
  const garageValue =
    totalValue > 0 || cars.length === 0 ? totalValue : sumGarageValue(cars);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">My cars</h1>
          <p className="mt-2 max-w-2xl text-sm text-steel">
            List an owned car for sale in Brad Coins, change the price, or unlist it. Other members buy
            from the Cars catalogue. Garage value is the sum of each car’s list / fair Brad Coin price.
            Sold and purchase history show cars you sold or bought — price, counterparty when known,
            and when. No real money leaves this bay.
          </p>
          {user ? (
            <p className="mt-4 font-display text-2xl text-lime">{formatCoins(user.coinBalance)}</p>
          ) : null}
          {user ? <p className="mt-1 text-xs uppercase tracking-wide text-steel">Wallet</p> : null}
          {!loading ? (
            <div className="mt-4">
              <p className="font-display text-2xl text-mist">{formatCoins(garageValue)}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-steel">Garage value</p>
              {cars.length > 0 ? (
                <p className="mt-2 text-sm text-steel">
                  {cars.length} {cars.length === 1 ? "car" : "cars"}
                  {forSaleCount > 0 ? ` · ${forSaleCount} for sale` : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-lime">{notice}</p> : null}
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
          <ul className="mt-4 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => (
              <li key={car.id} className="bay-rise">
                <CarCard
                  car={car}
                  to={`/cars/${car.id}`}
                  badge={badgeForStatus(car.status, "for_sale")}
                  layout="media"
                  footer={
                    <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                      {(car.status === "owned" || car.status === "available") && (
                        <form
                          className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
                          onSubmit={(e) => void onListOrUpdatePrice(e, car)}
                        >
                          <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:w-auto">
                            Brad Coin price
                            <input
                              className="w-full rounded-md border border-white/10 bg-bay-panel px-2 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
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
                            className="w-full rounded-md bg-rose px-4 py-2 font-display text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                          >
                            {car.status === "available" ? "Update price" : "List for sale"}
                          </button>
                        </form>
                      )}
                      {car.status === "available" ? (
                        <button
                          type="button"
                          disabled={busyId === car.id}
                          onClick={() => void onUnlist(car.id)}
                          className="w-full rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist hover:border-lime/40 hover:text-lime disabled:opacity-60 sm:w-auto"
                        >
                          Unlist
                        </button>
                      ) : null}
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl text-mist">Purchase history</h2>
          <p className="mt-2 text-sm text-steel">
            Cars you bought with Brad Coins, newest first.
          </p>
          {purchases.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">
              No purchases yet.{" "}
              <Link to="/cars" className="text-lime no-underline hover:underline">
                Browse cars
              </Link>
              .
            </p>
          ) : null}
          {purchases.length > 0 ? (
            <ul className="mt-4 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              {purchases.map((purchase) => (
                <li key={purchase.ledgerId} className="bay-rise">
                  <CarCard
                    to={`/cars/${purchase.listingId}`}
                    badge="price"
                    layout="media"
                    car={{
                      id: purchase.listingId,
                      make: purchase.make,
                      model: purchase.model,
                      trimName: purchase.trimName,
                      bodyType: purchase.bodyType,
                      colour: purchase.colour,
                      year: purchase.year,
                      coinPrice: purchase.paidPrice,
                      status: "owned",
                    }}
                    footer={
                      <div className="border-t border-white/10 pt-3 text-xs text-steel">
                        <p>
                          {purchase.sellerDisplayName
                            ? `Seller: ${purchase.sellerDisplayName}`
                            : "Seller unknown"}
                        </p>
                        <p className="mt-0.5">{new Date(purchase.purchasedAt).toLocaleString()}</p>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl text-mist">Sold history</h2>
          <p className="mt-2 text-sm text-steel">
            Cars you sold to other members, newest first.
          </p>
          {sales.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">No sales yet. List a car and wait for a buyer.</p>
          ) : null}
          {sales.length > 0 ? (
            <ul className="mt-4 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              {sales.map((sale) => (
                <li key={sale.ledgerId} className="bay-rise">
                  <CarCard
                    to={`/cars/${sale.listingId}`}
                    badge="sold"
                    layout="media"
                    car={{
                      id: sale.listingId,
                      make: sale.make,
                      model: sale.model,
                      trimName: sale.trimName,
                      bodyType: sale.bodyType,
                      colour: sale.colour,
                      year: sale.year,
                      coinPrice: sale.soldPrice,
                      status: "sold",
                    }}
                    footer={
                      <div className="border-t border-white/10 pt-3 text-xs text-steel">
                        <p className="font-display text-sm font-semibold text-lime">
                          {formatCoins(sale.soldPrice)}
                        </p>
                        <p className="mt-1">
                          {sale.buyerDisplayName
                            ? `Buyer: ${sale.buyerDisplayName}`
                            : "Buyer unknown"}
                        </p>
                        <p className="mt-0.5">{new Date(sale.soldAt).toLocaleString()}</p>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-mist">Coin ledger</h2>
            <Link to="/ledger" className="font-display text-sm text-lime no-underline hover:underline">
              Full ledger
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="text-mist">{entry.reason.replace("_", " ")}</p>
                  <p className="text-xs text-steel">
                    {entry.note || new Date(entry.createdAt).toLocaleString()}
                  </p>
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
