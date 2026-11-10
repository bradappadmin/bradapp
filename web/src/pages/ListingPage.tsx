import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import type { ListingDetail } from "../cars";
import { formatCoins, formatMileage, listingTitle } from "../cars";
import {
  compareHref,
  ensureComparePick,
  loadCompareSelection,
  toComparePick,
  type ComparePick,
} from "../compare-selection";
import { CarHeroVisual } from "../components/CarCard";
import { CompareTray } from "../components/CompareTray";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { garageTradeOfferAction, garageTradeOfferHref } from "../garage-trade-offer";
import { listingChallengeAction, listingChallengeHref } from "../listing-challenge";
import { rememberRecentlyViewed } from "../recently-viewed";
import { listingSharePath } from "../share-link";
import { useToast } from "../toast-context";

export function ListingPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const { user, setUser, refresh, refreshFavouriteCount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [favourited, setFavourited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);

  useEffect(() => {
    setComparePicks(loadCompareSelection());
  }, [listingId]);

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

  function onStartCompare() {
    if (!listing) return;
    const { picks } = ensureComparePick(toComparePick(listing));
    setComparePicks(picks);
    navigate(picks.length >= 2 ? compareHref(picks) : "/compare");
  }

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
      toast.success("Bought — car is in your garage.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      setActionError(msg);
      toast.error(msg);
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
      await refreshFavouriteCount();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update favourite");
    } finally {
      setFavBusy(false);
    }
  }

  const ownsListing = Boolean(user && listing && listing.ownerUserId === user.id);
  const canBuy = Boolean(listing && listing.status === "available" && !ownsListing);
  const challengeAction = listing
    ? listingChallengeAction({
        ownerUserId: listing.ownerUserId,
        viewerId: user?.id,
      })
    : "hidden";
  const tradeAction = listing
    ? garageTradeOfferAction({
        ownerUserId: listing.ownerUserId,
        viewerId: user?.id,
      })
    : "hidden";

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/cars"
          className="inline-flex rounded-md border border-white/12 px-3 py-1.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
        >
          ← Back to cars
        </Link>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        {listing ? (
          <article className="bay-rise mt-6">
            <header className="mb-5">
              <p className="text-xs uppercase tracking-[0.28em] text-steel">
                Listing · Midnight garage
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {listingTitle(listing)}
              </h1>
              <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Listing status">
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold capitalize text-mist">
                  {listing.conditionType}
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {listing.year}
                </span>
                <span
                  className={`rounded-md border px-3 py-1.5 font-display text-xs font-semibold capitalize ${
                    listing.status === "available"
                      ? "border-lime/35 bg-lime/10 text-lime"
                      : "border-white/12 bg-bay-panel/60 text-steel"
                  }`}
                >
                  {listing.status}
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {listing.colour}
                </span>
              </div>
            </header>

            <div className="play-panel overflow-hidden rounded-md border p-2 sm:p-3">
              <CarHeroVisual
                colour={listing.colour}
                bodyType={listing.bodyType}
                make={listing.make}
                model={listing.model}
                title={listingTitle(listing)}
                className="!mt-0"
              />
            </div>

            <section
              className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-6 sm:p-5"
              aria-labelledby="listing-price-heading"
            >
              <div className="min-w-0">
                <p id="listing-price-heading" className="text-xs uppercase tracking-wide text-steel">
                  Brad Coin price
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-lime sm:text-4xl">
                  {formatCoins(listing.coinPrice)}
                </p>
                <p className="mt-2 text-sm text-steel">
                  Brad Coins only — no real money. Buy moves the car into your garage.
                </p>
                {canBuy && user ? (
                  <p className="mt-2 text-xs text-steel">
                    Your balance: {formatCoins(user.coinBalance)}
                  </p>
                ) : null}
              </div>
            </section>

            <div className="mt-5 flex flex-wrap gap-3" aria-label="Listing actions">
              {canBuy ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onBuy()}
                  className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy
                    ? "Buying…"
                    : user
                      ? `Buy for ${formatCoins(listing.coinPrice)}`
                      : "Sign in to buy"}
                </button>
              ) : null}
              {challengeAction === "challenge" && listing.ownerUserId != null ? (
                <Link
                  to={listingChallengeHref(listing.ownerUserId, listing.id)}
                  className="inline-block rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                >
                  Challenge to Top Trumps
                </Link>
              ) : null}
              {tradeAction === "offer" && listing.ownerUserId != null ? (
                <Link
                  to={garageTradeOfferHref(listing.ownerUserId, listing.id)}
                  className="inline-block rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                >
                  Offer trade
                </Link>
              ) : null}
              {challengeAction === "signin" || tradeAction === "signin" ? (
                <Link
                  to="/signin"
                  className="inline-block rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                >
                  Sign in to challenge or trade
                </Link>
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
              <button
                type="button"
                onClick={onStartCompare}
                className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
              >
                {comparePicks.some((p) => p.id === listing.id) && comparePicks.length >= 2
                  ? "Side by side"
                  : comparePicks.some((p) => p.id === listing.id)
                    ? "Continue compare"
                    : "Compare"}
              </button>
              <CopyShareLinkButton path={listingSharePath(listing.id)} label="Copy link" />
            </div>

            {favourited ? (
              <p className="mt-3 text-xs text-steel">
                In your{" "}
                <Link to="/favourites" className="text-lime no-underline hover:underline">
                  Favourites
                </Link>
                — tick a second car there, or use Compare to queue this one.
              </p>
            ) : (
              <p className="mt-3 text-xs text-steel">
                Compare queues this car, then open{" "}
                <Link to="/favourites" className="text-lime no-underline hover:underline">
                  Favourites
                </Link>{" "}
                or{" "}
                <Link to="/cars" className="text-lime no-underline hover:underline">
                  Cars
                </Link>{" "}
                for a second pick.
              </p>
            )}

            {ownsListing ? (
              <p className="play-panel mt-6 rounded-md border border-lime/30 p-4 text-sm text-lime">
                You own this car. List it for sale, change the price, or unlist in{" "}
                <Link to="/garage" className="underline">
                  My cars
                </Link>
                .
              </p>
            ) : null}

            {actionError ? <p className="mt-3 text-sm text-rose">{actionError}</p> : null}

            <section
              className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
              aria-labelledby="listing-specs-heading"
            >
              <h2
                id="listing-specs-heading"
                className="font-display text-lg font-semibold text-mist sm:text-xl"
              >
                Specs & bay
              </h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
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
                  <dd className="mt-1 text-mist">
                    {listing.ownerUserId != null ? (
                      <Link
                        to={`/members/${listing.ownerUserId}`}
                        className="text-mist no-underline hover:text-lime"
                      >
                        {listing.ownerLabel}
                      </Link>
                    ) : (
                      listing.ownerLabel
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-steel">Garage</dt>
                  <dd className="mt-1 text-mist">
                    {listing.garageName}, {listing.garageCity}
                    <span className="mt-1 block text-sm text-steel">{listing.garageTagline}</span>
                  </dd>
                </div>
              </dl>
            </section>
          </article>
        ) : null}

        <CompareTray picks={comparePicks} onChange={setComparePicks} />
      </main>
    </div>
  );
}
