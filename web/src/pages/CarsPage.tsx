import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { CarFilters, ListingSummary, SearchQuery } from "../cars";
import {
  activeFilterChips,
  clearFilterChip,
  hasActiveFilters,
} from "../cars";
import {
  CARS_SORT_OPTIONS,
  DEFAULT_CARS_SORT,
  parseCarsSort,
  type CarsSort,
} from "../cars-sort";
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

const emptyQuery: SearchQuery = {
  q: "",
  make: "",
  model: "",
  bodyType: "",
  fuel: "",
  colour: "",
  garage: "",
  condition: "",
  yearMin: "",
  yearMax: "",
  coinMin: "",
  coinMax: "",
  mileageMax: "",
  bhpMin: "",
  sort: DEFAULT_CARS_SORT,
};

function queryFromParams(params: URLSearchParams): SearchQuery {
  const next: SearchQuery = { ...emptyQuery };
  const q = params.get("q");
  if (q != null) next.q = q;
  const make = params.get("make");
  if (make != null) next.make = make;
  const model = params.get("model");
  if (model != null) next.model = model;
  const bodyType = params.get("bodyType");
  if (bodyType != null) next.bodyType = bodyType;
  const fuel = params.get("fuel");
  if (fuel != null) next.fuel = fuel;
  const colour = params.get("colour");
  if (colour != null) next.colour = colour;
  const garage = params.get("garage");
  if (garage != null) next.garage = garage;
  const condition = params.get("condition");
  if (condition === "new" || condition === "used" || condition === "") next.condition = condition;
  const yearMin = params.get("yearMin");
  if (yearMin != null) next.yearMin = yearMin;
  const yearMax = params.get("yearMax");
  if (yearMax != null) next.yearMax = yearMax;
  const coinMin = params.get("coinMin");
  if (coinMin != null) next.coinMin = coinMin;
  const coinMax = params.get("coinMax");
  if (coinMax != null) next.coinMax = coinMax;
  const mileageMax = params.get("mileageMax");
  if (mileageMax != null) next.mileageMax = mileageMax;
  const bhpMin = params.get("bhpMin");
  if (bhpMin != null) next.bhpMin = bhpMin;
  next.sort = parseCarsSort(params.get("sort"));
  return next;
}

function paramsFromQuery(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (
      value == null ||
      value === "" ||
      (key === "sort" && value === DEFAULT_CARS_SORT)
    ) {
      continue;
    }
    params.set(key, String(value));
  }
  return params;
}

export function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<CarFilters | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);

  const draft = useMemo(() => queryFromParams(searchParams), [searchParams]);
  const [form, setForm] = useState<SearchQuery>(draft);
  const chips = useMemo(() => activeFilterChips(draft), [draft]);
  const filtersOn = hasActiveFilters(draft);
  // Search + sort stay while loading, when listings match, or while filters are active (no-match CTA).
  const showSearch = loading || listings.length > 0 || filtersOn;

  useEffect(() => {
    setComparePicks(loadCompareSelection());
  }, []);

  useEffect(() => {
    setForm(draft);
    if (draft.colour || draft.mileageMax || draft.bhpMin) {
      setShowMore(true);
    }
  }, [draft]);

  function onCompareCard(listing: ListingSummary) {
    const pick = toComparePick(listing);
    const already = comparePicks.some((p) => p.id === listing.id);
    // Same session tray as listing detail: ensure adds without toggling off;
    // a second click on an already-queued card removes it (catalogue UX).
    const { picks } = already ? toggleComparePick(pick) : ensureComparePick(pick);
    setComparePicks(picks);
  }

  useEffect(() => {
    void api
      .fetchCarFilters()
      .then((res) => setFilters(res.filters))
      .catch(() => {
        setError("Could not load filters");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      const res = await api.fetchModels(form.make || undefined);
      if (!cancelled) setModels(res.models);
    }
    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [form.make]);

  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.searchCars(draft);
        if (!cancelled) {
          setListings(res.listings);
          setTotal(res.total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Search failed");
          setListings([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [draft]);

  function applyQuery(next: SearchQuery) {
    setForm(next);
    setSearchParams(paramsFromQuery(next));
  }

  function setField<K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "make" ? { model: "" } : {}),
    }));
  }

  /** Selects apply immediately so the catalogue stays snappy. */
  function applySelect<K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) {
    const next: SearchQuery = {
      ...form,
      [key]: value,
      ...(key === "make" ? { model: "" } : {}),
    };
    applyQuery(next);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    applyQuery(form);
  }

  function clearFilters() {
    applyQuery(emptyQuery);
  }

  function removeChip(key: keyof SearchQuery) {
    applyQuery(clearFilterChip(draft, key));
  }

  const fieldClass =
    "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";
  const labelClass = "flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel";

  let emptyTitle = "Nothing for sale";
  let emptyBody =
    "The bay is empty right now. Check back after members list cars from My cars.";
  if (filtersOn) {
    emptyTitle = "No matches";
    const qText = draft.q?.trim() ?? "";
    if (qText && chips.length === 1 && chips[0]?.key === "q") {
      emptyBody = `Nothing for sale matches “${qText}”. Try another spelling or clear the filters.`;
    } else if (qText) {
      emptyBody = `Nothing for sale matches “${qText}” with those filters. Widen the bay or clear the filters.`;
    } else {
      emptyBody =
        "Nothing for sale fits those filters. Drop a make or garage, widen the year or Brad Coin range, or clear everything and start again.";
    }
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
              Find a car
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Real makes and models with studio photos. Filter the bay by make, body, garage, year,
              and Brad Coins — prices are play money, including cars members list from My cars.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Catalogue bay notes">
              <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                Photo-first grid
              </span>
              <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                Brad Coin prices
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/compare"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Compare
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              My cars
            </Link>
          </div>
        </header>

        {showSearch ? (
          <>
        <form
          onSubmit={onSubmit}
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-6"
          role="search"
          aria-label="Car catalogue filters"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-display text-lg text-mist sm:text-xl">Search the bay</h2>
            <p className="text-xs text-steel">Free text first · filters apply as you pick</p>
          </div>

          <label className={`${labelClass} mt-5`}>
            Search
            <input
              className={fieldClass}
              type="search"
              name="q"
              value={form.q ?? ""}
              onChange={(e) => setField("q", e.target.value)}
              placeholder="Make, model, or trim…"
              aria-label="Search make, model, or trim"
            />
          </label>

          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Core filters</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClass}>
                Make
                <select
                  className={fieldClass}
                  value={form.make ?? ""}
                  onChange={(e) => applySelect("make", e.target.value)}
                >
                  <option value="">Any make</option>
                  {(filters?.makes ?? []).map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Model
                <select
                  className={fieldClass}
                  value={form.model ?? ""}
                  onChange={(e) => applySelect("model", e.target.value)}
                >
                  <option value="">Any model</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Body
                <select
                  className={fieldClass}
                  value={form.bodyType ?? ""}
                  onChange={(e) => applySelect("bodyType", e.target.value)}
                >
                  <option value="">Any body</option>
                  {(filters?.bodyTypes ?? []).map((body) => (
                    <option key={body} value={body}>
                      {body}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Fuel
                <select
                  className={fieldClass}
                  value={form.fuel ?? ""}
                  onChange={(e) => applySelect("fuel", e.target.value)}
                >
                  <option value="">Any fuel</option>
                  {(filters?.fuels ?? []).map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Garage
                <select
                  className={fieldClass}
                  value={form.garage ?? ""}
                  onChange={(e) => applySelect("garage", e.target.value)}
                >
                  <option value="">Any garage</option>
                  {(filters?.garages ?? []).map((garage) => (
                    <option key={garage.name} value={garage.name}>
                      {garage.name} · {garage.city}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                New / used
                <select
                  className={fieldClass}
                  value={form.condition ?? ""}
                  onChange={(e) =>
                    applySelect("condition", e.target.value as SearchQuery["condition"])
                  }
                >
                  <option value="">Any condition</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Ranges</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-1.5 text-xs uppercase tracking-wide text-steel">
                  Year range
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    aria-label="Minimum year"
                    value={form.yearMin ?? ""}
                    onChange={(e) => setField("yearMin", e.target.value)}
                    placeholder={filters ? String(filters.yearMin) : "From"}
                  />
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    aria-label="Maximum year"
                    value={form.yearMax ?? ""}
                    onChange={(e) => setField("yearMax", e.target.value)}
                    placeholder={filters ? String(filters.yearMax) : "To"}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-1.5 text-xs uppercase tracking-wide text-steel">
                  Brad Coin price
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    aria-label="Minimum Brad Coins"
                    value={form.coinMin ?? ""}
                    onChange={(e) => setField("coinMin", e.target.value)}
                    placeholder={filters ? String(filters.coinPriceMin) : "Min BC"}
                  />
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    aria-label="Maximum Brad Coins"
                    value={form.coinMax ?? ""}
                    onChange={(e) => setField("coinMax", e.target.value)}
                    placeholder={filters ? String(filters.coinPriceMax) : "Max BC"}
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {showMore ? (
            <div className="mt-5 border-t border-white/8 pt-5">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">More filters</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className={labelClass}>
                  Colour
                  <select
                    className={fieldClass}
                    value={form.colour ?? ""}
                    onChange={(e) => applySelect("colour", e.target.value)}
                  >
                    <option value="">Any colour</option>
                    {(filters?.colours ?? []).map((colour) => (
                      <option key={colour} value={colour}>
                        {colour}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Max mileage
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    value={form.mileageMax ?? ""}
                    onChange={(e) => setField("mileageMax", e.target.value)}
                    placeholder="e.g. 30000"
                  />
                </label>
                <label className={labelClass}>
                  Min BHP
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    value={form.bhpMin ?? ""}
                    onChange={(e) => setField("bhpMin", e.target.value)}
                    placeholder="e.g. 300"
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-5">
            <button
              type="submit"
              className="bay-cta rounded-md bg-rose px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
            >
              {showMore ? "Fewer filters" : "More filters"}
            </button>
            {filtersOn ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-rose/50 hover:text-rose"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </form>

        {chips.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={`${chip.key}-${chip.label}`}>
                <button
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  className="rounded-md border border-lime/25 bg-lime/10 px-3 py-1.5 text-xs text-lime transition hover:border-rose/40 hover:bg-rose/10 hover:text-rose"
                  title={`Remove ${chip.label}`}
                >
                  {chip.label}
                  <span className="ml-2 text-steel" aria-hidden>
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-4 sm:p-5"
          role="search"
          aria-label="Sort catalogue listings"
        >
          <div className="min-w-0">
            <p className="font-display text-lg text-mist">Sort the bay</p>
            <p className="mt-1 text-sm text-steel">
              Lowest price, highest price, or newest year. Choice stays in the URL and
              reorders the server search.
            </p>
          </div>
          <label className="mt-4 flex w-full flex-col gap-1.5 text-xs uppercase tracking-wide text-steel sm:mt-0 sm:w-56">
            Sort by
            <select
              className={fieldClass}
              value={parseCarsSort(draft.sort)}
              onChange={(e) =>
                applySelect("sort", parseCarsSort(e.target.value) as CarsSort)
              }
              aria-label="Sort catalogue by price or year"
            >
              {CARS_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
          </>
        ) : null}

        {showSearch || loading ? (
          <div className="mt-8 mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-mist">Listings</h2>
            <p className="text-sm text-steel">
              {loading
                ? "Searching…"
                : `${total.toLocaleString()} listing${total === 1 ? "" : "s"}${
                    filtersOn ? " match" : " for sale"
                  }`}
            </p>
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-rose">{error}</p> : null}

        {!loading && listings.length === 0 ? (
          <div
            className={`play-panel rounded-md border px-5 py-12 text-center sm:py-14 ${
              showSearch ? "bay-rise-delay mt-2" : "bay-rise-delay mt-10"
            }`}
            role="status"
            aria-label={filtersOn ? "No matching cars" : "Empty cars bay"}
          >
            <p className="font-display text-xl text-mist sm:text-2xl">{emptyTitle}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">{emptyBody}</p>
            {filtersOn ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {listings.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => {
              const selected = comparePicks.some((p) => p.id === listing.id);
              return (
                <li key={listing.id} className="bay-rise">
                  <CarCard
                    car={listing}
                    to={`/cars/${listing.id}`}
                    badge="price"
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
                            onCompareCard(listing);
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
        ) : null}

        <CompareTray picks={comparePicks} onChange={setComparePicks} />
      </main>
    </div>
  );
}
