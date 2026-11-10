import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { FavouriteCar } from "../api";
import { useAuth } from "../auth-context";
import { badgeForStatus } from "../car-visuals";
import {
  ensureComparePick,
  loadCompareSelection,
  toComparePick,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import { CarCard } from "../components/CarCard";
import { CompareTray } from "../components/CompareTray";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { filterFavouritesByCarQuery } from "../favourites-car-filter";
import { garageTradeOfferAction, garageTradeOfferHref } from "../garage-trade-offer";
import { listingChallengeAction, listingChallengeHref } from "../listing-challenge";
import {
  DEFAULT_FAVOURITES_SORT,
  FAVOURITES_SORT_OPTIONS,
  parseFavouritesSort,
  sortFavouriteCars,
  type FavouritesSort,
} from "../favourites-sort";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function FavouritesPage() {
  const { user, loading: authLoading, refreshFavouriteCount } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = parseFavouritesSort(searchParams.get("sort"));
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
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
    setDraft(qFromUrl);
  }, [qFromUrl]);

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

  // Filter-as-you-type: debounce URL updates (client filter over the loaded list).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      if (sort !== DEFAULT_FAVOURITES_SORT) params.set("sort", sort);
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, sort, setSearchParams]);

  const filteredCars = useMemo(
    () => filterFavouritesByCarQuery(cars, qFromUrl),
    [cars, qFromUrl],
  );
  const visibleCars = useMemo(
    () => sortFavouriteCars(filteredCars, sort),
    [filteredCars, sort],
  );
  const filtersOn = Boolean(qFromUrl);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function writeParams(nextQ: string, nextSort: FavouritesSort) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextSort !== DEFAULT_FAVOURITES_SORT) params.set("sort", nextSort);
    setSearchParams(params, { replace: true });
  }

  function onSubmitSearch(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, sort);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", DEFAULT_FAVOURITES_SORT);
  }

  async function onRemove(carId: number) {
    setBusyId(carId);
    setError(null);
    try {
      await api.removeFavourite(carId);
      await reload();
      await refreshFavouriteCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove favourite");
    } finally {
      setBusyId(null);
    }
  }

  function onCompareCard(car: FavouriteCar) {
    const pick = toComparePick(car);
    const already = comparePicks.some((p) => p.id === car.id);
    // Same session tray as Cars / My cars / Recently viewed / listing detail.
    const { picks } = already ? toggleComparePick(pick) : ensureComparePick(pick);
    setComparePicks(picks);
  }

  function setSort(next: FavouritesSort) {
    writeParams(qFromUrl, next);
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
              Cars you saved from the catalogue — each card keeps a compact Top Trumps peek under the
              studio photo (Power / 0–60 / Top speed), same as Cars. Compare queues into the shared
              tray with Cars / My cars — or open a listing anytime. Offer trade and Challenge stay on
              someone else’s cars.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Favourites bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Photo-first grid
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  Top Trumps peek
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {filtersOn ? visibleCars.length : cars.length}{" "}
                  {(filtersOn ? visibleCars.length : cars.length) === 1
                    ? "saved car"
                    : "saved cars"}
                  {filtersOn ? " match" : ""}
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
            <form
              onSubmit={onSubmitSearch}
              className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
              role="search"
              aria-label="Search favourite cars"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="font-display text-lg text-mist sm:text-xl">Find a favourite</h2>
                <p className="text-xs text-steel">
                  Make or model · filter as you type · stays in the URL
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
                    aria-label="Search favourites by make or model"
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
                  Showing{" "}
                  {!loading ? (
                    <>
                      {visibleCars.length} of {cars.length}{" "}
                      {cars.length === 1 ? "car" : "cars"}
                    </>
                  ) : (
                    "…"
                  )}{" "}
                  for <span className="font-display text-lime">“{qFromUrl}”</span>
                </p>
              ) : null}
            </form>

            <div
              className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-4 sm:p-5"
              aria-label="Sort favourite cars"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-mist">Sort the bay</p>
                <p className="mt-1 text-sm text-steel">
                  Highest or lowest Brad Coin price, or name. Choice stays in the URL.
                </p>
              </div>
              <label className="mt-4 flex w-full flex-col gap-1.5 text-xs uppercase tracking-wide text-steel sm:mt-0 sm:w-56">
                Sort by
                <select
                  className="w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                  value={sort}
                  onChange={(e) => setSort(parseFavouritesSort(e.target.value))}
                  aria-label="Sort saved favourite cars"
                >
                  {FAVOURITES_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!loading && visibleCars.length === 0 ? (
              <div
                className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-12 text-center sm:py-14"
                role="status"
                aria-label="No matching favourites"
              >
                <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                  No saved cars match “{qFromUrl}”. Try another spelling or clear the filters.
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

            {visibleCars.length > 0 ? (
              <section className="bay-rise-delay mt-10" aria-labelledby="favourites-grid">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="favourites-grid" className="font-display text-xl text-mist">
                    Saved
                  </h2>
                  <p className="text-sm text-steel">
                    {visibleCars.length} {visibleCars.length === 1 ? "car" : "cars"}
                  </p>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleCars.map((car) => {
                    const selected = comparePicks.some((p) => p.id === car.id);
                    const challengeAction = listingChallengeAction({
                      ownerUserId: car.ownerUserId,
                      viewerId: user?.id,
                    });
                    const tradeAction = garageTradeOfferAction({
                      ownerUserId: car.ownerUserId,
                      viewerId: user?.id,
                    });
                    return (
                      <li key={car.id} className="bay-rise">
                        <CarCard
                          car={car}
                          to={`/cars/${car.id}`}
                          badge={badgeForStatus(car.status, "price")}
                          layout="media"
                          footer={
                            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
                              <div className="flex flex-wrap gap-2">
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
                                {challengeAction === "challenge" && car.ownerUserId != null ? (
                                  <Link
                                    to={listingChallengeHref(car.ownerUserId, car.id)}
                                    className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-xs font-semibold text-lime no-underline transition hover:bg-lime/10"
                                  >
                                    Challenge to Top Trumps
                                  </Link>
                                ) : null}
                                {tradeAction === "offer" && car.ownerUserId != null ? (
                                  <Link
                                    to={garageTradeOfferHref(car.ownerUserId, car.id)}
                                    className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                                  >
                                    Offer trade
                                  </Link>
                                ) : null}
                                {challengeAction === "signin" || tradeAction === "signin" ? (
                                  <Link
                                    to="/signin"
                                    className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-xs font-semibold text-lime no-underline transition hover:bg-lime/10"
                                  >
                                    Sign in to challenge or trade
                                  </Link>
                                ) : null}
                                <button
                                  type="button"
                                  disabled={busyId === car.id}
                                  onClick={() => void onRemove(car.id)}
                                  className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist transition hover:border-rose hover:text-rose disabled:opacity-60"
                                >
                                  {busyId === car.id ? "Removing…" : "Remove"}
                                </button>
                              </div>
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
          </>
        ) : null}
      </main>
    </div>
  );
}
