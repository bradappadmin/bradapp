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
  const [cars, setCars] = useState<RecentlyViewedCar[]>([]);

  useEffect(() => {
    setCars(loadRecentlyViewed());
  }, []);

  if (cars.length === 0) return null;

  function onClear() {
    clearRecentlyViewed();
    setCars([]);
    toast.success("Cleared recently viewed on this device.");
  }

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
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel transition hover:border-rose/40 hover:text-rose"
          >
            Clear
          </button>
          <Link
            to="/cars"
            className="rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
          >
            Browse cars
          </Link>
        </div>
      </div>
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
    </section>
  );
}
