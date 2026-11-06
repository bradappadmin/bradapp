import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as api from "../api";
import type { ListingDetail } from "../cars";
import { formatCoins, formatMileage, listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function ListingPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isFinite(listingId) || listingId <= 0) {
        setError("Invalid listing");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.fetchListing(listingId);
        if (!cancelled) {
          setListing(res.listing);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setListing(null);
          setError(err instanceof Error ? err.message : "Could not load listing");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/cars" className="text-sm text-lime no-underline hover:underline">
          ← Back to cars
        </Link>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        {listing ? (
          <article className="bay-rise mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">
              {listing.conditionType} · {listing.year}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              {listingTitle(listing)}
            </h1>
            <p className="mt-4 font-display text-3xl font-semibold text-lime">
              {formatCoins(listing.coinPrice)}
            </p>
            <p className="mt-2 text-sm text-steel">
              Made-up price in Brad Coins. Buying lands in a later slice.
            </p>

            <dl className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Colour</dt>
                <dd className="mt-1 text-mist">{listing.colour}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Mileage</dt>
                <dd className="mt-1 text-mist">{formatMileage(listing.mileage)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Body / fuel</dt>
                <dd className="mt-1 text-mist">
                  {listing.bodyType} · {listing.fuel} · {listing.drivetrain}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Doors / seats</dt>
                <dd className="mt-1 text-mist">
                  {listing.doors} doors · {listing.seats} seats
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Power</dt>
                <dd className="mt-1 text-mist">{listing.bhp} bhp</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Top speed</dt>
                <dd className="mt-1 text-mist">{listing.topSpeedMph} mph</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">0–60</dt>
                <dd className="mt-1 text-mist">{listing.zeroToSixtySecs}s</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Owner</dt>
                <dd className="mt-1 text-mist">{listing.ownerLabel}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-steel">Garage</dt>
                <dd className="mt-1 text-mist">
                  {listing.garageName}, {listing.garageCity}
                  <span className="mt-1 block text-sm text-steel">{listing.garageTagline}</span>
                </dd>
              </div>
            </dl>
          </article>
        ) : null}
      </main>
    </div>
  );
}
