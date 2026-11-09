import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { FavouriteCar } from "../api";
import { useAuth } from "../auth-context";
import { badgeForStatus } from "../car-visuals";
import {
  clearCompareSelection,
  compareHref,
  loadCompareSelection,
  toComparePick,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import { listingTitle } from "../cars";
import { CarCard } from "../components/CarCard";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";

export function FavouritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState<FavouriteCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);

  async function reload() {
    const res = await api.fetchFavourites();
    setCars(res.cars);
  }

  useEffect(() => {
    setComparePicks(loadCompareSelection());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load favourites");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** Drop compare picks that are no longer favourited on this page. */
  useEffect(() => {
    if (loading) return;
    const favouriteIds = new Set(cars.map((car) => car.id));
    setComparePicks((prev) => {
      const filtered = prev.filter((pick) => favouriteIds.has(pick.id));
      if (filtered.length === prev.length) return prev;
      if (filtered.length === 0) clearCompareSelection();
      return filtered;
    });
  }, [cars, loading]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  async function onRemove(carId: number) {
    setBusyId(carId);
    setError(null);
    try {
      await api.removeFavourite(carId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove favourite");
    } finally {
      setBusyId(null);
    }
  }

  function onToggleSelect(car: FavouriteCar) {
    const { picks } = toggleComparePick(toComparePick(car));
    setComparePicks(picks);
  }

  function onClearSelect() {
    clearCompareSelection();
    setComparePicks([]);
  }

  const selectedCount = comparePicks.length;
  const canCompare = selectedCount === 2;
  const compareTo = useMemo(() => compareHref(comparePicks), [comparePicks]);

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Favourites
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Cars you saved from the catalogue. Tick exactly two, then Compare these for a side-by-side
              bay face-off — or open a listing anytime.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Favourites bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Photo-first grid
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {cars.length} {cars.length === 1 ? "saved car" : "saved cars"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/cars"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Browse cars
            </Link>
            <Link
              to="/compare"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Compare
            </Link>
          </div>
        </header>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && cars.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-14 text-center"
            role="status"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">No favourites yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              Save a listing from Cars and it will land here — ready to open, compare, or remove.
            </p>
            <Link
              to="/cars"
              className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Browse cars
            </Link>
          </div>
        ) : null}

        {cars.length > 0 ? (
          <>
            <div
              className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-4 sm:p-5"
              role="region"
              aria-label="Compare favourites"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-mist">Compare favourites</p>
                <p className="mt-1 text-sm text-steel">
                  Select exactly two saved cars ({selectedCount}/2).
                </p>
                {selectedCount > 0 ? (
                  <ul className="mt-2 list-none space-y-0.5 p-0 text-sm text-mist">
                    {comparePicks.map((pick) => (
                      <li key={pick.id} className="truncate">
                        {listingTitle(pick)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-steel">Tick the boxes on the cards below.</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                {selectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={onClearSelect}
                    className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-rose/50 hover:text-rose"
                  >
                    Clear
                  </button>
                ) : null}
                {canCompare ? (
                  <Link
                    to={compareTo}
                    className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-2.5 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                  >
                    Compare these
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-md border border-white/10 px-5 py-2.5 font-display text-sm font-semibold text-steel disabled:opacity-60"
                  >
                    Compare these
                  </button>
                )}
              </div>
            </div>

            <section className="bay-rise-delay mt-10" aria-labelledby="favourites-grid">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="favourites-grid" className="font-display text-xl text-mist">
                  Saved
                </h2>
                <p className="text-sm text-steel">
                  {cars.length} {cars.length === 1 ? "car" : "cars"}
                </p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cars.map((car) => {
                  const selected = comparePicks.some((p) => p.id === car.id);
                  const selectionFull = selectedCount >= 2 && !selected;
                  const checkboxId = `favourite-compare-${car.id}`;
                  return (
                    <li key={car.id} className="bay-rise">
                      <CarCard
                        car={car}
                        to={`/cars/${car.id}`}
                        badge={badgeForStatus(car.status, "price")}
                        layout="media"
                        footer={
                          <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
                            <label
                              htmlFor={checkboxId}
                              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                                selected
                                  ? "border-lime/45 bg-lime/10 text-lime"
                                  : selectionFull
                                    ? "border-white/10 text-steel"
                                    : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
                              }`}
                            >
                              <input
                                id={checkboxId}
                                type="checkbox"
                                className="h-4 w-4 accent-[var(--color-lime)]"
                                checked={selected}
                                disabled={selectionFull}
                                onChange={() => onToggleSelect(car)}
                              />
                              <span className="font-display text-xs font-semibold">
                                {selected
                                  ? "Selected for compare"
                                  : selectionFull
                                    ? "Pair full — clear one first"
                                    : "Select for compare"}
                              </span>
                            </label>
                            <button
                              type="button"
                              disabled={busyId === car.id}
                              onClick={() => void onRemove(car.id)}
                              className="w-fit rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist transition hover:border-rose hover:text-rose disabled:opacity-60"
                            >
                              {busyId === car.id ? "Removing…" : "Remove"}
                            </button>
                          </div>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
