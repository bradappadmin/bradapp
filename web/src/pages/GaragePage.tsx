import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, LedgerEntry, PurchasedCar, SoldCar } from "../api";
import { useAuth } from "../auth-context";
import { paintOptionsFor } from "../car-image";
import { formatCoins } from "../cars";
import { badgeForStatus } from "../car-visuals";
import {
  ensureComparePick,
  loadCompareSelection,
  toComparePick,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import { CarCard } from "../components/CarCard";
import { CarVisual } from "../components/CarVisual";
import { CompareTray } from "../components/CompareTray";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { GarageBayValueStrip } from "../components/GarageBayValueStrip";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { filterGarageCarsByQuery } from "../garage-car-filter";
import {
  DEFAULT_GARAGE_SORT,
  GARAGE_SORT_OPTIONS,
  parseGarageSort,
  sortGarageCars,
  type GarageSort,
} from "../garage-sort";
import { sumGarageValue } from "../garage-value";
import { garageSharePath } from "../share-link";
import { useToast } from "../toast-context";

/** Catalogue-scale Brad Coin asking prices — tap fills the free-form field. */
const SELL_PRICE_PRESETS = [50, 100, 250, 500] as const;

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function SectionShell({
  id,
  title,
  count,
  hint,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="bay-rise-delay mt-10" aria-labelledby={id}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="font-display text-xl text-mist sm:text-2xl">
          {title}
        </h2>
        {typeof count === "number" ? (
          <p className="text-sm text-steel">
            {count} {count === 1 ? "car" : "cars"}
          </p>
        ) : null}
      </div>
      {hint ? <p className="mb-4 max-w-2xl text-sm text-steel">{hint}</p> : null}
      {children}
    </section>
  );
}

function EmptyBay({ children }: { children: ReactNode }) {
  return <div className="play-panel rounded-md border px-4 py-5 text-sm text-steel">{children}</div>;
}

export function GaragePage() {
  const { user, loading: authLoading, setUser, refresh } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = parseGarageSort(searchParams.get("sort"));
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [showcaseListingId, setShowcaseListingId] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [sales, setSales] = useState<SoldCar[]>([]);
  const [purchases, setPurchases] = useState<PurchasedCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellPrices, setSellPrices] = useState<Record<number, string>>({});
  const [sellColours, setSellColours] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);

  useEffect(() => {
    setComparePicks(loadCompareSelection());
  }, []);

  function onCompareCard(car: GarageCar) {
    const pick = toComparePick(car);
    const already = comparePicks.some((p) => p.id === car.id);
    // Same session tray as Cars / listing detail: ensure adds without toggling off;
    // a second click on an already-queued card removes it.
    const { picks } = already ? toggleComparePick(pick) : ensureComparePick(pick);
    setComparePicks(picks);
  }

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
    setShowcaseListingId(
      typeof garage.showcaseListingId === "number" ? garage.showcaseListingId : null,
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

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  // Filter-as-you-type: debounce URL updates (client filter over owned / for-sale).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      writeParams(next, sort);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, sort]);

  const filteredCars = useMemo(
    () => filterGarageCarsByQuery(cars, qFromUrl),
    [cars, qFromUrl],
  );
  const ownedCars = useMemo(
    () =>
      sortGarageCars(
        filteredCars.filter((c) => c.status === "owned"),
        sort,
      ),
    [filteredCars, sort],
  );
  const forSaleCars = useMemo(
    () =>
      sortGarageCars(
        filteredCars.filter((c) => c.status === "available"),
        sort,
      ),
    [filteredCars, sort],
  );
  const ownedTotal = useMemo(
    () => cars.filter((c) => c.status === "owned").length,
    [cars],
  );
  const forSaleTotal = useMemo(
    () => cars.filter((c) => c.status === "available").length,
    [cars],
  );
  const garageValue =
    totalValue > 0 || cars.length === 0 ? totalValue : sumGarageValue(cars);
  const filtersOn = Boolean(qFromUrl);
  const managedMatchCount = ownedCars.length + forSaleCars.length;

  function writeParams(nextQ: string, nextSort: GarageSort) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextSort !== DEFAULT_GARAGE_SORT) params.set("sort", nextSort);
    setSearchParams(params, { replace: true });
  }

  function setSort(next: GarageSort) {
    writeParams(qFromUrl, next);
  }

  function onSubmitSearch(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, sort);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", DEFAULT_GARAGE_SORT);
  }

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
    const nextPrice = Math.trunc(price);
    if (car.status === "available") {
      if (nextPrice === car.coinPrice) {
        setNotice(`Asking price is already ${formatCoins(nextPrice)}.`);
        return;
      }
      setBusyId(car.id);
      setError(null);
      setNotice(null);
      try {
        await api.updateListingPrice(car.id, nextPrice);
        await reload();
        await refresh();
        const noticeText = `Updated asking price to ${formatCoins(nextPrice)} — still for sale.`;
        setNotice(noticeText);
        toast.success(noticeText);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not update price";
        setError(msg);
        toast.error(msg);
      } finally {
        setBusyId(null);
      }
      return;
    }

    const colour = sellColours[car.id] ?? car.colour;
    setBusyId(car.id);
    setError(null);
    setNotice(null);
    try {
      await api.sellListing(car.id, nextPrice, colour);
      await reload();
      await refresh();
      const noticeText = `Listed for sale at ${formatCoins(nextPrice)} · ${colour}. Other members can buy it from Cars.`;
      setNotice(noticeText);
      toast.success(noticeText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update listing";
      setError(msg);
      toast.error(msg);
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
      const noticeText = "Unlisted — car is back in your garage only.";
      setNotice(noticeText);
      toast.success(noticeText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not unlist";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function onUpdatePaint(car: GarageCar) {
    const colour = sellColours[car.id] ?? car.colour;
    if (colour === car.colour) {
      setNotice(`Paint is already ${colour}.`);
      return;
    }
    setBusyId(car.id);
    setError(null);
    setNotice(null);
    try {
      await api.updateListingPaint(car.id, colour);
      await reload();
      const noticeText = `Updated paint to ${colour} — still for sale.`;
      setNotice(noticeText);
      toast.success(noticeText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update paint";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleShowcase(car: GarageCar) {
    const pinning = showcaseListingId !== car.id;
    setBusyId(car.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.setGarageShowcase(pinning ? car.id : null);
      setShowcaseListingId(res.showcaseListingId);
      const noticeText = pinning
        ? "Showcase pinned — friends see this car as your garage hero."
        : "Showcase unpinned — the bay picks the highest-value car instead.";
      setNotice(noticeText);
      toast.success(noticeText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update showcase";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  function renderManagedCar(car: GarageCar) {
    const isShowcase = showcaseListingId === car.id;
    const selected = comparePicks.some((p) => p.id === car.id);
    const draftColour = sellColours[car.id] ?? car.colour;
    const displayCar = { ...car, colour: draftColour };
    return (
      <li key={car.id} className="bay-rise">
        <CarCard
          car={displayCar}
          to={`/cars/${car.id}`}
          badge={badgeForStatus(car.status, "for_sale")}
          layout="media"
          footer={
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              {(car.status === "owned" || car.status === "available") && (
                <form
                  className="flex w-full flex-col gap-2"
                  onSubmit={(e) => void onListOrUpdatePrice(e, car)}
                >
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-steel">
                      Quick price
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={`Sell price presets for ${car.make} ${car.model}`}
                    >
                      {SELL_PRICE_PRESETS.map((amount) => {
                        const current = sellPrices[car.id] ?? String(car.coinPrice);
                        const active = current === String(amount);
                        return (
                          <button
                            key={amount}
                            type="button"
                            aria-pressed={active}
                            disabled={busyId === car.id}
                            onClick={() =>
                              setSellPrices((prev) => ({
                                ...prev,
                                [car.id]: String(amount),
                              }))
                            }
                            className={`rounded-md border px-3 py-1.5 font-display text-sm transition disabled:opacity-60 ${
                              active
                                ? "border-lime/50 bg-lime/10 text-lime"
                                : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                            }`}
                          >
                            {amount} BC
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <CarVisual
                        colour={draftColour}
                        make={car.make}
                        model={car.model}
                        year={car.year}
                        bodyType={car.bodyType}
                        size="thumb"
                        title={`${car.make} ${car.model} paint preview`}
                        className="h-14 w-20 shrink-0"
                      />
                      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                        Paint
                        <select
                          aria-label={`Paint colour for ${car.make} ${car.model}`}
                          className="w-full rounded-md border border-white/10 bg-bay-panel px-2 py-2 text-sm normal-case tracking-normal text-mist outline-none ring-lime/40 focus:ring-2"
                          value={draftColour}
                          disabled={busyId === car.id}
                          onChange={(e) =>
                            setSellColours((prev) => ({
                              ...prev,
                              [car.id]: e.target.value,
                            }))
                          }
                        >
                          {paintOptionsFor(car.colour).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {car.status === "available" ? (
                      <button
                        type="button"
                        disabled={busyId === car.id || draftColour === car.colour}
                        aria-label={`Update paint for ${car.make} ${car.model}`}
                        onClick={() => void onUpdatePaint(car)}
                        className="w-full rounded-md border border-lime/40 bg-bay-panel/70 px-4 py-2 font-display text-sm font-semibold text-lime transition hover:border-lime/60 hover:bg-lime/10 disabled:opacity-60 sm:w-auto"
                      >
                        Update paint
                      </button>
                    ) : null}
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:w-auto">
                      Brad Coin price
                      <input
                        className="w-full rounded-md border border-white/10 bg-bay-panel px-2 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        aria-label={`Brad Coin price for ${car.make} ${car.model}`}
                        value={sellPrices[car.id] ?? String(car.coinPrice)}
                        onChange={(e) =>
                          setSellPrices((prev) => ({ ...prev, [car.id]: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={
                        busyId === car.id ||
                        (car.status === "available" &&
                          Number(sellPrices[car.id] ?? car.coinPrice) === car.coinPrice)
                      }
                      aria-label={
                        car.status === "available"
                          ? `Update price for ${car.make} ${car.model}`
                          : undefined
                      }
                      className="w-full rounded-md bg-rose px-4 py-2 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
                    >
                      {car.status === "available" ? "Update price" : "List for sale"}
                    </button>
                  </div>
                </form>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={busyId === car.id}
                  onClick={() => void onToggleShowcase(car)}
                  className={
                    isShowcase
                      ? "w-full rounded-md border border-lime/40 bg-lime/10 px-4 py-2 font-display text-sm font-semibold text-lime transition hover:bg-lime/15 disabled:opacity-60 sm:w-auto"
                      : "w-full rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime disabled:opacity-60 sm:w-auto"
                  }
                >
                  {isShowcase ? "Unpin showcase" : "Make showcase"}
                </button>
                {car.status === "available" ? (
                  <button
                    type="button"
                    disabled={busyId === car.id}
                    onClick={() => void onUnlist(car.id)}
                    className="w-full rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime disabled:opacity-60 sm:w-auto"
                  >
                    Unlist
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={selected ? "Remove from compare" : "Add to compare"}
                  onClick={() => onCompareCard(car)}
                  className={`w-full rounded-md border px-4 py-2 font-display text-sm font-semibold transition sm:w-auto ${
                    selected
                      ? "border-lime/50 text-lime hover:bg-lime/10"
                      : "border-white/15 text-steel hover:border-lime/40 hover:text-lime"
                  }`}
                >
                  {selected ? "In compare" : "Compare"}
                </button>
              </div>
            </div>
          }
        />
      </li>
    );
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              My cars
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Your bay — list owned cars for Brad Coins, change the price, or unlist. Owned and
              for-sale cards keep a compact Top Trumps peek under the studio photo (Power / 0–60 /
              Top speed), same as Cars and Favourites. Pin one as the public showcase hero. Garage
              value is the sum of each car’s list / fair price. No real money leaves this bay.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Garage bay notes">
                {user ? (
                  <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                    Wallet {formatCoins(user.coinBalance)}
                  </span>
                ) : null}
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  Garage value {formatCoins(garageValue)}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  Top Trumps peek
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {filtersOn
                    ? `${managedMatchCount} match${managedMatchCount === 1 ? "" : "es"}`
                    : `${cars.length} owned · ${forSaleTotal} for sale`}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {showcaseListingId != null ? "Showcase pinned" : "Showcase: highest value"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {user ? (
              <>
                <Link
                  to={`/members/${user.id}`}
                  className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                >
                  Public garage
                </Link>
                <CopyShareLinkButton
                  path={garageSharePath(user.id)}
                  label="Copy garage link"
                  className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm font-semibold text-mist transition hover:border-lime/35 hover:text-lime"
                />
              </>
            ) : null}
            <Link
              to="/cars"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Browse cars
            </Link>
            <Link
              to="/compare"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Compare
            </Link>
            <Link
              to="/ledger"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Full ledger
            </Link>
          </div>
        </header>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-lime">{notice}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        {!loading && cars.length > 0 ? <GarageBayValueStrip cars={cars} /> : null}

        {!loading && cars.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="Empty garage bay"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No cars in your garage yet. Browse the catalogue for Brad Coins, or check Favourites
              for cars you’ve saved.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/cars"
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Browse cars
              </Link>
              <Link
                to="/favourites"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Favourites
              </Link>
            </div>
          </div>
        ) : null}

        {cars.length > 0 ? (
          <form
            onSubmit={onSubmitSearch}
            className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
            role="search"
            aria-label="Search garage cars"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-lg text-mist sm:text-xl">Find a car</h2>
              <p className="text-xs text-steel">
                Make or model · Owned &amp; For sale · stays in the URL
              </p>
            </div>
            <label className="mt-4 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Search
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className={fieldClass}
                  type="search"
                  name="q"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Make or model…"
                  aria-label="Search garage by make or model"
                  autoComplete="off"
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Search
                  </button>
                  {filtersOn ? (
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              </div>
            </label>
            {filtersOn ? (
              <p className="mt-4 text-sm text-steel">
                Showing {managedMatchCount} of {cars.length}{" "}
                {cars.length === 1 ? "car" : "cars"} for{" "}
                <span className="font-display text-lime">“{qFromUrl}”</span>
              </p>
            ) : null}
          </form>
        ) : null}

        {cars.length > 0 ? (
          <div
            className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-4 sm:p-5"
            aria-label="Sort garage cars"
          >
            <div className="min-w-0">
              <p className="font-display text-lg text-mist">Sort the bay</p>
              <p className="mt-1 text-sm text-steel">
                Highest or lowest Brad Coin price, or name — same as Favourites. Applies to Owned
                and For sale. Choice stays in the URL.
              </p>
            </div>
            <label className="mt-4 flex w-full flex-col gap-1.5 text-xs uppercase tracking-wide text-steel sm:mt-0 sm:w-56">
              Sort by
              <select
                className="w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                value={sort}
                onChange={(e) => setSort(parseGarageSort(e.target.value))}
                aria-label="Sort Owned and For sale cars"
              >
                {GARAGE_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {cars.length > 0 && filtersOn && managedMatchCount === 0 && !loading ? (
          <div
            className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="No matching garage cars"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No owned or for-sale cars match “{qFromUrl}”. Try another spelling or clear the
              filters.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClearFilters}
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : null}

        {cars.length > 0 && !(filtersOn && managedMatchCount === 0) ? (
          <>
            <SectionShell
              id="garage-owned"
              title="Owned"
              count={loading ? undefined : ownedCars.length}
              hint="In your bay only — list one to put it on the Cars catalogue."
            >
              {ownedCars.length === 0 && !loading ? (
                <EmptyBay>
                  {filtersOn ? (
                    <>No owned cars match “{qFromUrl}”.</>
                  ) : ownedTotal === 0 ? (
                    "Every car you own is listed for sale right now."
                  ) : (
                    "No owned cars in this view."
                  )}
                </EmptyBay>
              ) : null}
              {ownedCars.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {ownedCars.map((car) => renderManagedCar(car))}
                </ul>
              ) : null}
            </SectionShell>

            <SectionShell
              id="garage-for-sale"
              title="For sale"
              count={loading ? undefined : forSaleCars.length}
              hint="Live on the Cars catalogue. Update the Brad Coin price or unlist anytime."
            >
              {forSaleCars.length === 0 && !loading ? (
                <EmptyBay>
                  {filtersOn
                    ? `No for-sale cars match “${qFromUrl}”.`
                    : forSaleTotal === 0
                      ? "Nothing listed. Pick an owned car and list it for sale."
                      : "No for-sale cars in this view."}
                </EmptyBay>
              ) : null}
              {forSaleCars.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {forSaleCars.map((car) => renderManagedCar(car))}
                </ul>
              ) : null}
            </SectionShell>
          </>
        ) : null}

        <SectionShell
          id="garage-purchases"
          title="Purchases"
          count={loading ? undefined : purchases.length}
          hint="Cars you bought with Brad Coins, newest first."
        >
          {purchases.length === 0 && !loading ? (
            <EmptyBay>
              No purchases yet.{" "}
              <Link to="/cars" className="text-lime no-underline hover:underline">
                Browse cars
              </Link>
              .
            </EmptyBay>
          ) : null}
          {purchases.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </SectionShell>

        <SectionShell
          id="garage-sold"
          title="Sold"
          count={loading ? undefined : sales.length}
          hint="Cars you sold to other members, newest first."
        >
          {sales.length === 0 && !loading ? (
            <EmptyBay>No sales yet. List a car and wait for a buyer.</EmptyBay>
          ) : null}
          {sales.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </SectionShell>

        <section className="bay-rise-delay mt-10" aria-labelledby="garage-ledger">
          <div className="play-panel rounded-md border p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="garage-ledger" className="font-display text-xl text-mist">
                Coin ledger
              </h2>
              <Link
                to="/ledger"
                className="font-display text-sm text-lime no-underline hover:underline"
              >
                Full ledger
              </Link>
            </div>
            <p className="mt-2 text-sm text-steel">Recent Brad Coin moves tied to this bay.</p>
            <ul className="mt-4 divide-y divide-white/10 border-t border-white/8">
              {ledger.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline justify-between gap-4 py-3 text-sm"
                >
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
          </div>
        </section>

        <CompareTray picks={comparePicks} onChange={setComparePicks} />
      </main>
    </div>
  );
}
