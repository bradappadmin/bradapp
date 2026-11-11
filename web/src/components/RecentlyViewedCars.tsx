import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { badgeForStatus } from "../car-visuals";
import {
  ensureComparePick,
  loadCompareSelection,
  toComparePick,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import {
  clearRecentlyViewed,
  loadRecentlyViewed,
  type RecentlyViewedCar,
} from "../recently-viewed";
import { useToast } from "../toast-context";
import { CarCard } from "./CarCard";
import { CompareTray } from "./CompareTray";

export function RecentlyViewedCars() {
  const toast = useToast();
  const [cars, setCars] = useState<RecentlyViewedCar[] | null>(null);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setCars(loadRecentlyViewed());
    setComparePicks(loadCompareSelection());
  }, []);

  function onConfirmClear() {
    clearRecentlyViewed();
    setCars([]);
    setConfirmClear(false);
    toast.success("Cleared recently viewed on this device.");
  }

  function onCompareCard(car: RecentlyViewedCar) {
    const pick = toComparePick(car);
    const already = comparePicks.some((p) => p.id === car.id);
    // Same session tray as Cars / My cars / listing detail.
    const { picks } = already ? toggleComparePick(pick) : ensureComparePick(pick);
    setComparePicks(picks);
  }

  if (cars === null) return null;

  const empty = cars.length === 0;

  return (
    <section
      className="bay-rise-delay mt-12 border-t border-white/10 pt-8"
      aria-label="Recently viewed cars"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="font-display text-xl text-mist sm:text-2xl">Recently viewed</h2>
          <p className="mt-1 text-sm text-steel">
            Last few listings you opened on this device — each card keeps a compact Top Trumps peek
            under the studio photo (Power / 0–60 / Top speed), same as Cars and Favourites. Compare
            queues into the same tray as Cars and My cars.
          </p>
          {!empty ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Recently viewed bay notes">
              <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                Top Trumps peek
              </span>
              <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                {cars.length} {cars.length === 1 ? "listing" : "listings"}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!empty ? (
            confirmClear ? (
              <>
                <button
                  type="button"
                  onClick={onConfirmClear}
                  className="rounded-md border border-rose/45 bg-rose/10 px-3 py-1.5 font-display text-sm font-semibold text-rose transition hover:border-rose/70 hover:bg-rose/20"
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel transition hover:border-white/30 hover:text-mist"
                >
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel transition hover:border-rose/40 hover:text-rose"
              >
                Clear
              </button>
            )
          ) : null}
          <Link
            to="/cars"
            className="rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
          >
            Browse cars
          </Link>
          <Link
            to="/compare"
            className="rounded-md border border-white/12 px-3 py-1.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
          >
            Compare
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
                        aria-pressed={selected}
                        aria-label={selected ? "Remove from compare" : "Add to compare"}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onCompareCard(car);
                        }}
                        className={`rounded-md border px-3 py-1.5 font-display text-xs font-semibold transition ${
                          selected
                            ? "border-lime/50 text-lime hover:bg-lime/10"
                            : "border-white/15 text-steel hover:border-lime/40 hover:text-lime"
                        }`}
                      >
                        {selected ? "In compare" : "Compare"}
                      </button>
                    </div>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <CompareTray picks={comparePicks} onChange={setComparePicks} />
    </section>
  );
}
