import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import * as api from "../../api";
import type { AdminCarModel, AdminGarage, AdminListing } from "../../api";
import {
  ADMIN_INVENTORY_GROUP_OPTIONS,
  filterAdminInventory,
  parseAdminInventoryGroup,
  type AdminInventoryGroup,
} from "../../admin-inventory-filter";
import { carStudioImageUrl, STUDIO_PAINT_COLOURS } from "../../car-image";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";

type Tab = "listings" | "models" | "garages";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

const LISTINGS_PREVIEW_LIMIT = 40;

export function AdminInventoryPage() {
  return (
    <AdminGuard>
      <AdminInventoryInner />
    </AdminGuard>
  );
}

function AdminInventoryInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const group = parseAdminInventoryGroup(searchParams.get("group"));
  const [draft, setDraft] = useState(qFromUrl);
  const [tab, setTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [models, setModels] = useState<AdminCarModel[]>([]);
  const [garages, setGarages] = useState<AdminGarage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(
    () => filterAdminInventory(listings, qFromUrl, group),
    [listings, qFromUrl, group],
  );
  const filtersOn = Boolean(qFromUrl) || group !== "all";
  const visibleListings = filtersOn ? filtered : filtered.slice(0, LISTINGS_PREVIEW_LIMIT);

  function writeParams(nextQ: string, nextGroup: AdminInventoryGroup) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextGroup !== "all") params.set("group", nextGroup);
    setSearchParams(params, { replace: true });
  }

  async function reload() {
    const [l, m, g] = await Promise.all([
      api.fetchAdminListings(),
      api.fetchAdminCarModels(),
      api.fetchAdminGarages(),
    ]);
    setListings(l.listings);
    setModels(m.models);
    setGarages(g.garages);
  }

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load inventory");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter-as-you-type: debounce URL updates (client filter over the loaded list).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      if (group !== "all") params.set("group", group);
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, group, setSearchParams]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, group);
  }

  function onClearSearch() {
    setDraft("");
    writeParams("", group);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", "all");
  }

  function setGroup(next: AdminInventoryGroup) {
    writeParams(qFromUrl, next);
  }

  async function saveListing(id: number, coinPrice: number, colour: string) {
    setError(null);
    try {
      await api.patchAdminListing(id, { coinPrice, colour });
      setMessage(`Listing #${id} updated.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing update failed");
    }
  }

  async function saveModel(id: number, bhp: number) {
    setError(null);
    try {
      await api.patchAdminCarModel(id, { bhp });
      setMessage(`Model #${id} power updated.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Model update failed");
    }
  }

  async function saveGarage(id: number, tagline: string) {
    setError(null);
    try {
      await api.patchAdminGarage(id, { tagline });
      setMessage(`Garage #${id} updated.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Garage update failed");
    }
  }

  const tabClass = (value: Tab) =>
    `shrink-0 rounded-md border px-3 py-1.5 font-display text-sm transition ${
      tab === value
        ? "border-lime/50 bg-lime/10 text-lime"
        : "border-white/15 text-steel hover:border-lime/35 hover:text-mist"
    }`;

  return (
    <AdminShell
      wide
      title="Cars & garages"
      description="Correct listings, paint for studio photos, model specs, and garage copy."
    >
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Inventory sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "listings"}
          className={tabClass("listings")}
          onClick={() => setTab("listings")}
        >
          Listings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "models"}
          className={tabClass("models")}
          onClick={() => setTab("models")}
        >
          Models
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "garages"}
          className={tabClass("garages")}
          onClick={() => setTab("garages")}
        >
          Garages
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

      {tab === "listings" ? (
        <>
          <form
            onSubmit={onSubmit}
            className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:p-5"
            role="search"
            aria-label="Search inventory listings"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-lg text-mist sm:text-xl">Find a listing</h2>
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
                  placeholder="Make, model, or trim…"
                  aria-label="Search listings by make or model"
                  autoComplete="off"
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Search
                  </button>
                  {qFromUrl ? (
                    <button
                      type="button"
                      onClick={onClearSearch}
                      className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </label>

            <div className="mt-5 border-t border-white/8 pt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Filter by status</p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter listings by status"
              >
                {ADMIN_INVENTORY_GROUP_OPTIONS.map((option) => {
                  const active = group === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setGroup(option.id)}
                      className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                        active
                          ? "border-lime/50 bg-lime/10 text-lime"
                          : "border-white/15 text-steel hover:border-lime/35 hover:text-lime"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filtersOn ? (
              <p className="mt-4 text-sm text-steel">
                Showing{" "}
                {!loading ? (
                  <>
                    {filtered.length} of {listings.length}{" "}
                    {listings.length === 1 ? "listing" : "listings"}
                  </>
                ) : (
                  "…"
                )}
                {qFromUrl ? (
                  <>
                    {" "}
                    for <span className="font-display text-lime">“{qFromUrl}”</span>
                  </>
                ) : null}
                {group !== "all" ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-display text-lime">
                      {ADMIN_INVENTORY_GROUP_OPTIONS.find((o) => o.id === group)?.label}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </form>

          <div className="mt-8 mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl text-mist">Directory</h2>
            <p className="text-sm text-steel">
              {loading
                ? "Loading…"
                : filtersOn
                  ? `${visibleListings.length} ${
                      visibleListings.length === 1 ? "listing" : "listings"
                    }`
                  : `${Math.min(LISTINGS_PREVIEW_LIMIT, listings.length)} of ${listings.length}`}
            </p>
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="play-panel rounded-md border px-5 py-12 text-center" role="status">
              {filtersOn ? (
                <>
                  <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                    No listings match
                    {qFromUrl ? ` “${qFromUrl}”` : " that filter"}. Try another spelling or clear
                    the filters.
                  </p>
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl text-mist sm:text-2xl">No listings yet</p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                    The inventory bay is empty right now.
                  </p>
                </>
              )}
            </div>
          ) : null}

          {visibleListings.length > 0 ? (
            <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
              {visibleListings.map((listing) => (
                <ListingPaintRow
                  key={listing.id}
                  listing={listing}
                  onSave={(coinPrice, colour) => {
                    void saveListing(listing.id, coinPrice, colour);
                  }}
                />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {tab === "models" ? (
        <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
          {models.slice(0, 40).map((model) => (
            <li
              key={model.id}
              className="admin-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-mist break-words">
                  {model.make} {model.model} {model.trimName}
                </p>
                <p className="text-xs text-steel">
                  {model.bodyType} · {model.fuel} · {model.topSpeedMph} mph ·{" "}
                  {model.zeroToSixtySecs}s
                </p>
              </div>
              <div className="admin-panel flex w-full items-end gap-2 rounded-md border p-2 sm:w-auto">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:flex-none">
                  BHP
                  <input
                    id={`bhp-${model.id}`}
                    className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
                    type="number"
                    defaultValue={model.bhp}
                  />
                </label>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-white/15 px-3 py-2 text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                  onClick={() => {
                    const el = document.getElementById(`bhp-${model.id}`) as HTMLInputElement | null;
                    void saveModel(model.id, Number(el?.value || model.bhp));
                  }}
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "garages" ? (
        <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
          {garages.map((garage) => (
            <li key={garage.id} className="admin-row flex flex-col gap-2 py-4">
              <p className="text-mist">
                {garage.name} · {garage.city}
              </p>
              <div className="admin-panel flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex w-full min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                  Tagline
                  <input
                    id={`tag-${garage.id}`}
                    className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                    defaultValue={garage.tagline}
                  />
                </label>
                <button
                  type="button"
                  className="w-full rounded-md border border-white/15 px-3 py-2 text-sm text-mist transition hover:border-lime/40 hover:text-lime sm:w-auto"
                  onClick={() => {
                    const el = document.getElementById(`tag-${garage.id}`) as HTMLInputElement | null;
                    void saveGarage(garage.id, el?.value ?? garage.tagline);
                  }}
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminShell>
  );
}

function paintOptionsFor(current: string): string[] {
  if (STUDIO_PAINT_COLOURS.includes(current)) {
    return STUDIO_PAINT_COLOURS;
  }
  return [current, ...STUDIO_PAINT_COLOURS];
}

function ListingPaintRow({
  listing,
  onSave,
}: {
  listing: AdminListing;
  onSave: (coinPrice: number, colour: string) => void;
}) {
  const [colour, setColour] = useState(listing.colour);
  const [coinPrice, setCoinPrice] = useState(String(listing.coinPrice));

  useEffect(() => {
    setColour(listing.colour);
    setCoinPrice(String(listing.coinPrice));
  }, [listing.colour, listing.coinPrice, listing.id]);

  const previewSrc = carStudioImageUrl({
    make: listing.make,
    model: listing.model,
    colour,
    width: 240,
  });

  return (
    <li className="admin-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={previewSrc}
          alt={`${listing.make} ${listing.model} in ${colour}`}
          width={96}
          height={64}
          className="h-16 w-24 shrink-0 rounded-md border border-white/10 bg-bay-deep/60 object-contain object-bottom"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <p className="text-mist break-words">
            #{listing.id} {listing.make} {listing.model} · {listing.year} · {listing.status}
          </p>
          <p className="text-xs text-steel">
            {listing.garageName} · {listing.ownerLabel} · {colour}
          </p>
        </div>
      </div>
      <div className="admin-panel flex w-full flex-col gap-2 rounded-md border p-2 sm:w-auto sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:flex-none">
          Paint
          <select
            aria-label={`Paint colour for listing ${listing.id}`}
            className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-44"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
          >
            {paintOptionsFor(listing.colour).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:flex-none">
          Coins
          <input
            aria-label={`Coin price for listing ${listing.id}`}
            className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
            type="number"
            value={coinPrice}
            onChange={(e) => setCoinPrice(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="shrink-0 rounded-md border border-white/15 px-3 py-2 text-sm text-mist transition hover:border-lime/40 hover:text-lime"
          onClick={() => onSave(Number(coinPrice || listing.coinPrice), colour)}
        >
          Save
        </button>
      </div>
    </li>
  );
}
