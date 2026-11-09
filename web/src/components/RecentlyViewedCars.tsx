import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { badgeForStatus } from "../car-visuals";
import { loadRecentlyViewed, type RecentlyViewedCar } from "../recently-viewed";
import { CarCard } from "./CarCard";

export function RecentlyViewedCars() {
  const [cars, setCars] = useState<RecentlyViewedCar[]>([]);

  useEffect(() => {
    setCars(loadRecentlyViewed());
  }, []);

  if (cars.length === 0) return null;

  return (
    <section
      className="bay-rise-delay mt-12 border-t border-white/10 pt-8"
      aria-label="Recently viewed cars"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-mist sm:text-2xl">Recently viewed</h2>
          <p className="mt-1 text-sm text-steel">
            Last few listings you opened on this device.
          </p>
        </div>
        <Link to="/cars" className="font-display text-sm text-lime no-underline hover:underline">
          Browse cars
        </Link>
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
