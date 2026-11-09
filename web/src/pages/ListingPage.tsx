import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import type { ListingDetail } from "../cars";
import { formatCoins, formatMileage, listingTitle } from "../cars";
import { CarHeroVisual } from "../components/CarCard";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { SiteHeader } from "../components/SiteHeader";
import { rememberRecentlyViewed } from "../recently-viewed";
import { listingSharePath } from "../share-link";

export function ListingPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [favourited, setFavourited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

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
          setFavourited(Boolean(res.favourited));
          setError(null);
          rememberRecentlyViewed({
            id: res.listing.id,
            make: res.listing.make,
            model: res.listing.model,
            trimName: res.listing.trimName,
            bodyType: res.listing.bodyType,
            colour: res.listing.colour,
            year: res.listing.year,
            bhp: res.listing.bhp,
            topSpeedMph: res.listing.topSpeedMph,
            zeroToSixtySecs: res.listing.zeroToSixtySecs,
            coinPrice: res.listing.coinPrice,
            status: res.listing.status,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setListing(null);
          setFavourited(false);
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
  }, [listingId, user?.id]);

  async function onBuy() {
    if (!user) {
      navigate("/signin");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await api.buyListing(listingId);
      setUser({ ...user, coinBalance: res.balance });
      const detail = await api.fetchListing(listingId);
      setListing(detail.listing);
      setFavourited(Boolean(detail.favourited));
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleFavourite() {
    if (!user) {
      navigate("/signin");
      return;
    }
    setFavBusy(true);
    setActionError(null);
    try {
      if (favourited) {
        await api.removeFavourite(listingId);
        setFavourited(false);
      } else {
        await api.saveFavourite(listingId);
        setFavourited(true);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update favourite");
    } finally {
      setFavBusy(false);
    }
  }

  const ownsListing = Boolean(user && listing && listing.ownerUserId === user.id);
  const canBuy = Boolean(listing && listing.status === "available" && !ownsListing);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/cars" className="text-sm text-lime no-underline hover:underline">
          ← Back to cars
        </Link>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        {listing ? (
          <article className="bay-rise mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">
              {listing.conditionType} · {listing.year} · {listing.status}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              {listingTitle(listing)}
            </h1>
            <CarHeroVisual
              colour={listing.colour}
              bodyType={listing.bodyType}
              make={listing.make}
              model={listing.model}
              title={listingTitle(listing)}
            />
            <p className="mt-4 font-display text-3xl font-semibold text-lime">
              {formatCoins(listing.coinPrice)}
            </p>
            <p className="mt-2 text-sm text-steel">
              Brad Coins only — no real money. Buy moves the car into your garage.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {canBuy ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onBuy()}
                  className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Buying…" : user ? `Buy for ${formatCoins(listing.coinPrice)}` : "Sign in to buy"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={favBusy}
                onClick={() => void onToggleFavourite()}
                className={`rounded-md border px-5 py-3 font-display text-sm font-semibold transition disabled:opacity-60 ${
                  favourited
                    ? "border-lime/50 text-lime hover:bg-lime/10"
                    : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
                }`}
              >
                {favBusy
                  ? "Saving…"
                  : !user
                    ? "Sign in to favourite"
                    : favourited
                      ? "Saved · Unfavourite"
                      : "Save to favourites"}
              </button>
              <CopyShareLinkButton path={listingSharePath(listing.id)} label="Copy share link" />
            </div>
            {canBuy && user ? (
              <p className="mt-2 text-xs text-steel">Your balance: {formatCoins(user.coinBalance)}</p>
            ) : null}
            {favourited ? (
              <p className="mt-2 text-xs text-steel">
                In your{" "}
                <Link to="/favourites" className="text-lime no-underline hover:underline">
                  Favourites
                </Link>
                .
              </p>
            ) : null}

            {ownsListing ? (
              <p className="mt-6 text-sm text-lime">
                You own this car. List it for sale, change the price, or unlist in{" "}
                <Link to="/garage" className="underline">
                  My cars
                </Link>
                .
              </p>
            ) : null}

            {actionError ? <p className="mt-3 text-sm text-rose">{actionError}</p> : null}

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
