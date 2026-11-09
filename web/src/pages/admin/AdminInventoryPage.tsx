import { useEffect, useState } from "react";
import * as api from "../../api";
import type { AdminCarModel, AdminGarage, AdminListing } from "../../api";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";

type Tab = "listings" | "models" | "garages";

export function AdminInventoryPage() {
  return (
    <AdminGuard>
      <AdminInventoryInner />
    </AdminGuard>
  );
}

function AdminInventoryInner() {
  const [tab, setTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [models, setModels] = useState<AdminCarModel[]>([]);
  const [garages, setGarages] = useState<AdminGarage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load inventory");
    });
  }, []);

  async function saveListing(id: number, coinPrice: number) {
    setError(null);
    try {
      await api.patchAdminListing(id, { coinPrice });
      setMessage(`Listing #${id} price updated.`);
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
      description="Correct listings, model specs, and garage copy."
    >
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Inventory sections"
      >
        <button type="button" role="tab" aria-selected={tab === "listings"} className={tabClass("listings")} onClick={() => setTab("listings")}>
          Listings
        </button>
        <button type="button" role="tab" aria-selected={tab === "models"} className={tabClass("models")} onClick={() => setTab("models")}>
          Models
        </button>
        <button type="button" role="tab" aria-selected={tab === "garages"} className={tabClass("garages")} onClick={() => setTab("garages")}>
          Garages
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

      {tab === "listings" ? (
        <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
          {listings.slice(0, 40).map((listing) => (
            <li
              key={listing.id}
              className="admin-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-mist break-words">
                  #{listing.id} {listing.make} {listing.model} · {listing.year} · {listing.status}
                </p>
                <p className="text-xs text-steel">
                  {listing.garageName} · {listing.ownerLabel}
                </p>
              </div>
              <div className="admin-panel flex w-full items-end gap-2 rounded-md border p-2 sm:w-auto">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:flex-none">
                  Coins
                  <input
                    id={`price-${listing.id}`}
                    className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
                    type="number"
                    defaultValue={listing.coinPrice}
                  />
                </label>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-white/15 px-3 py-2 text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                  onClick={() => {
                    const el = document.getElementById(`price-${listing.id}`) as HTMLInputElement | null;
                    void saveListing(listing.id, Number(el?.value || listing.coinPrice));
                  }}
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
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
                  {model.bodyType} · {model.fuel} · {model.topSpeedMph} mph · {model.zeroToSixtySecs}s
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
