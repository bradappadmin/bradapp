import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { FavouriteCar } from "../api";
import { useAuth } from "../auth-context";
import { badgeForStatus } from "../car-visuals";
import { CarCard } from "../components/CarCard";
import { SiteHeader } from "../components/SiteHeader";

export function FavouritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState<FavouriteCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    const res = await api.fetchFavourites();
    setCars(res.cars);
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Saved listings</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Favourites
        </h1>
        <p className="mt-3 max-w-xl text-sm text-steel">
          Cars you saved from the catalogue. Open a listing anytime, or remove it from this list.
        </p>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && cars.length === 0 ? (
          <p className="mt-8 text-sm text-steel">
            No favourites yet.{" "}
            <Link to="/cars" className="text-lime no-underline hover:underline">
              Browse cars
            </Link>{" "}
            and tap Save on a listing.
          </p>
        ) : null}

        {cars.length > 0 ? (
          <ul className="mt-8 grid gap-3 border-t border-white/10 pt-6">
            {cars.map((car) => (
              <li key={car.id}>
                <CarCard
                  car={car}
                  to={`/cars/${car.id}`}
                  badge={badgeForStatus(car.status, "price")}
                  dense
                  footer={
                    <button
                      type="button"
                      disabled={busyId === car.id}
                      onClick={() => void onRemove(car.id)}
                      className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist transition hover:border-rose hover:text-rose disabled:opacity-60"
                    >
                      {busyId === car.id ? "Removing…" : "Remove"}
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
