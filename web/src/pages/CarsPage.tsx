import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { CarFilters, ListingSummary, SearchQuery } from "../cars";
import { formatCoins, formatMileage, listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

const emptyQuery: SearchQuery = {
  q: "",
  make: "",
  model: "",
  bodyType: "",
  fuel: "",
  colour: "",
  condition: "",
  yearMin: "",
  yearMax: "",
  coinMin: "",
  coinMax: "",
  mileageMax: "",
  bhpMin: "",
  sort: "price_asc",
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
  const sort = params.get("sort");
  if (sort != null) next.sort = sort;
  return next;
}

function paramsFromQuery(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "" || (key === "sort" && value === "price_asc")) continue;
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

  const draft = useMemo(() => queryFromParams(searchParams), [searchParams]);
  const [form, setForm] = useState<SearchQuery>(draft);

  useEffect(() => {
    setForm(draft);
  }, [draft]);

  useEffect(() => {
    void api.fetchCarFilters().then((res) => setFilters(res.filters)).catch(() => {
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

  function setField<K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "make" ? { model: "" } : {}),
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSearchParams(paramsFromQuery(form));
  }

  function clearFilters() {
    setForm(emptyQuery);
    setSearchParams(new URLSearchParams());
  }

  const fieldClass =
    "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2";
  const labelClass = "flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="bay-rise mb-8">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">Find a car</h1>
          <p className="mt-2 max-w-2xl text-sm text-steel">
            Real makes and models. Garages, owners, and Brad Coin prices are play — nothing here buys a
            real car.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bay-rise-delay mb-8 grid gap-3 border-y border-white/10 py-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className={`${labelClass} sm:col-span-2 lg:col-span-2`}>
            Search
            <input
              className={fieldClass}
              value={form.q ?? ""}
              onChange={(e) => setField("q", e.target.value)}
              placeholder="Make, model, garage…"
            />
          </label>
          <label className={labelClass}>
            Make
            <select
              className={fieldClass}
              value={form.make ?? ""}
              onChange={(e) => setField("make", e.target.value)}
            >
              <option value="">Any</option>
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
              onChange={(e) => setField("model", e.target.value)}
            >
              <option value="">Any</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            New / used
            <select
              className={fieldClass}
              value={form.condition ?? ""}
              onChange={(e) => setField("condition", e.target.value as SearchQuery["condition"])}
            >
              <option value="">Any</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </label>
          <label className={labelClass}>
            Body
            <select
              className={fieldClass}
              value={form.bodyType ?? ""}
              onChange={(e) => setField("bodyType", e.target.value)}
            >
              <option value="">Any</option>
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
              onChange={(e) => setField("fuel", e.target.value)}
            >
              <option value="">Any</option>
              {(filters?.fuels ?? []).map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Colour
            <select
              className={fieldClass}
              value={form.colour ?? ""}
              onChange={(e) => setField("colour", e.target.value)}
            >
              <option value="">Any</option>
              {(filters?.colours ?? []).map((colour) => (
                <option key={colour} value={colour}>
                  {colour}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Min year
            <input
              className={fieldClass}
              type="number"
              value={form.yearMin ?? ""}
              onChange={(e) => setField("yearMin", e.target.value)}
              placeholder={filters ? String(filters.yearMin) : ""}
            />
          </label>
          <label className={labelClass}>
            Max year
            <input
              className={fieldClass}
              type="number"
              value={form.yearMax ?? ""}
              onChange={(e) => setField("yearMax", e.target.value)}
              placeholder={filters ? String(filters.yearMax) : ""}
            />
          </label>
          <label className={labelClass}>
            Min coins
            <input
              className={fieldClass}
              type="number"
              value={form.coinMin ?? ""}
              onChange={(e) => setField("coinMin", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Max coins
            <input
              className={fieldClass}
              type="number"
              value={form.coinMax ?? ""}
              onChange={(e) => setField("coinMax", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Max mileage
            <input
              className={fieldClass}
              type="number"
              value={form.mileageMax ?? ""}
              onChange={(e) => setField("mileageMax", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Min BHP
            <input
              className={fieldClass}
              type="number"
              value={form.bhpMin ?? ""}
              onChange={(e) => setField("bhpMin", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Sort
            <select
              className={fieldClass}
              value={form.sort ?? "price_asc"}
              onChange={(e) => setField("sort", e.target.value)}
            >
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="year_desc">Newest year</option>
              <option value="mileage_asc">Lowest mileage</option>
              <option value="bhp_desc">Highest BHP</option>
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="bay-cta rounded-md bg-rose px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-sm text-steel">
            {loading ? "Searching…" : `${total} listing${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {error ? <p className="mb-4 text-sm text-rose">{error}</p> : null}

        <ul className="divide-y divide-white/10 border-t border-white/10">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link
                to={`/cars/${listing.id}`}
                className="group flex flex-col gap-2 py-5 no-underline transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-mist group-hover:text-white">
                    {listingTitle(listing)}
                  </p>
                  <p className="mt-1 text-sm text-steel">
                    {listing.year} · {listing.conditionType} · {listing.colour} ·{" "}
                    {formatMileage(listing.mileage)}
                  </p>
                  <p className="mt-1 text-xs text-steel">
                    {listing.bhp} bhp · {listing.topSpeedMph} mph · {listing.zeroToSixtySecs}s 0–60 ·{" "}
                    {listing.garageName}, {listing.garageCity}
                  </p>
                </div>
                <p className="font-display text-xl font-semibold text-lime">
                  {formatCoins(listing.coinPrice)}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {!loading && listings.length === 0 ? (
          <p className="py-10 text-sm text-steel">No cars match those filters. Try clearing a few.</p>
        ) : null}
      </main>
    </div>
  );
}
