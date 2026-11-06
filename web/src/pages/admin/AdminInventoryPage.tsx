import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import type { AdminCarModel, AdminGarage, AdminListing } from "../../api";
import { AdminGuard } from "../../components/AdminGuard";
import { SiteHeader } from "../../components/SiteHeader";

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
    `font-display text-sm no-underline ${tab === value ? "text-lime" : "text-steel hover:text-mist"}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/admin" className="text-sm text-lime no-underline hover:underline">
          ← Admin
        </Link>
        <h1 className="bay-rise mt-4 font-display text-3xl font-semibold text-white">Cars & garages</h1>
        <p className="mt-2 text-sm text-steel">Correct listings, model specs, and garage copy.</p>

        <nav className="mt-6 flex gap-4 border-b border-white/10 pb-3">
          <button type="button" className={tabClass("listings")} onClick={() => setTab("listings")}>
            Listings
          </button>
          <button type="button" className={tabClass("models")} onClick={() => setTab("models")}>
            Models
          </button>
          <button type="button" className={tabClass("garages")} onClick={() => setTab("garages")}>
            Garages
          </button>
        </nav>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        {tab === "listings" ? (
          <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
            {listings.slice(0, 40).map((listing) => (
              <li key={listing.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-mist">
                    #{listing.id} {listing.make} {listing.model} · {listing.year} · {listing.status}
                  </p>
                  <p className="text-xs text-steel">
                    {listing.garageName} · {listing.ownerLabel}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                    Coins
                    <input
                      id={`price-${listing.id}`}
                      className="w-24 rounded-md border border-white/10 bg-bay-panel px-2 py-1.5 text-sm text-mist"
                      type="number"
                      defaultValue={listing.coinPrice}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
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
              <li key={model.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-mist">
                    {model.make} {model.model} {model.trimName}
                  </p>
                  <p className="text-xs text-steel">
                    {model.bodyType} · {model.fuel} · {model.topSpeedMph} mph · {model.zeroToSixtySecs}s
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                    BHP
                    <input
                      id={`bhp-${model.id}`}
                      className="w-24 rounded-md border border-white/10 bg-bay-panel px-2 py-1.5 text-sm text-mist"
                      type="number"
                      defaultValue={model.bhp}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
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
              <li key={garage.id} className="flex flex-col gap-2 py-4">
                <p className="text-mist">
                  {garage.name} · {garage.city}
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                    Tagline
                    <input
                      id={`tag-${garage.id}`}
                      className="rounded-md border border-white/10 bg-bay-panel px-2 py-1.5 text-sm text-mist"
                      defaultValue={garage.tagline}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
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
      </main>
    </div>
  );
}
