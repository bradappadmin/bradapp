import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { badgeForStatus } from "../car-visuals";
import {
  clearRecentlyViewed,
  loadRecentlyViewed,
  type RecentlyViewedCar,
} from "../recently-viewed";
import { useToast } from "../toast-context";
import { CarCard } from "./CarCard";

export function RecentlyViewedCars() {
  const toast = useToast();
  const [cars, setCars] = useState<RecentlyViewedCar[] | null>(null);

  useEffect(() => {
    setCars(loadRecentlyViewed());
  }, []);

  function onClear() {
    clearRecentlyViewed();
    setCars([]);
    toast.success("Cleared recently viewed on this device.");
  }

  if (cars === null) return null;

  const empty = cars.length === 0;

  return (
    <section
      className="bay-rise-delay mt-12 border-t border-white/10 pt-8"
      aria-label="Recently viewed cars"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-mist sm:text-2xl">Recently viewed</h2>
          <p className="mt-1 text-sm text-steel">
            Last few listings you opened on this device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!empty ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel transition hover:border-rose/40 hover:text-rose"
            >
              Clear
            </button>
          ) : null}
          <Link
            to="/cars"
            className="rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
          >
            Browse cars
          </Link>
        </div>
      </div>

      {empty ? (
        <div
          className="play-panel bay-rise-delay mt-5 rounded-md border px-5 py-12 text-center sm:py-14"
          role="status"
          aria-label="Empty recently viewed bay"
        >
          <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
            No listings on this device yet. Open a car from the catalogue and it will show up here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/cars"
              className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Browse cars
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <li key={car.id} className="bay-rise">
              <CarCard
                car={car}
                to={`/cars/${car.id}`}
                badge={badgeForStatus(car.status, "price")}
                layout="media"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
