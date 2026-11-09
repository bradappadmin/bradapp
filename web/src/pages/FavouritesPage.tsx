import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { FavouriteCar } from "../api";
import { useAuth } from "../auth-context";
import { badgeForStatus } from "../car-visuals";
import {
  loadCompareSelection,
  toComparePick,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import { CarCard } from "../components/CarCard";
import { CompareTray } from "../components/CompareTray";
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

  function onToggleCompare(car: FavouriteCar) {
    const { picks } = toggleComparePick(toComparePick(car));
    setComparePicks(picks);
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
              Favourites
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Cars you saved from the catalogue. Open a listing anytime, compare two side by side, or
              remove from this bay list.
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
                return (
                  <li key={car.id} className="bay-rise">
                    <CarCard
                      car={car}
                      to={`/cars/${car.id}`}
                      badge={badgeForStatus(car.status, "price")}
                      layout="media"
                      footer={
                        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                          <button
                            type="button"
                            onClick={() => onToggleCompare(car)}
                            className={`rounded-md border px-3 py-1.5 font-display text-xs font-semibold transition ${
                              selected
                                ? "border-lime/50 text-lime hover:bg-lime/10"
                                : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
                            }`}
                          >
                            {selected ? "In compare" : "Compare"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === car.id}
                            onClick={() => void onRemove(car.id)}
                            className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist transition hover:border-rose hover:text-rose disabled:opacity-60"
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
        ) : null}

        <CompareTray picks={comparePicks} onChange={setComparePicks} />
      </main>
    </div>
  );
}
