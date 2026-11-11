import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import type { ListingDetail } from "../cars";
import { formatCoins, listingTitle } from "../cars";
import {
  clearCompareSelection,
  compareHref,
  loadCompareSelection,
  type ComparePick,
} from "../compare-selection";
import {
  buildCompareRows,
  buildCompareTrumpRows,
  compareTitles,
  type CompareHighlight,
} from "../compare-specs";
import { CompareCarPanel } from "../components/CompareCarPanel";
import { CompareTrumpWinnersStrip } from "../components/CompareTrumpWinnersStrip";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { compareOpenMemberHref } from "../compare-open-member";
import { garageTradeOfferAction, garageTradeOfferHref } from "../garage-trade-offer";
import { listingChallengeAction, listingChallengeHref } from "../listing-challenge";
import { compareSharePath } from "../share-link";

function cellClass(side: "left" | "right", highlight: CompareHighlight): string {
  if (highlight === side) return "font-semibold text-lime";
  if (highlight === "tie") return "text-mist";
  return "text-mist";
}

export function ComparePage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [left, setLeft] = useState<ListingDetail | null>(null);
  const [right, setRight] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<ComparePick[]>([]);

  const a = Number(params.get("a") ?? "");
  const b = Number(params.get("b") ?? "");
  const hasPair = Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0 && a !== b;

  useEffect(() => {
    setPicks(loadCompareSelection());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasPair) {
        setLeft(null);
        setRight(null);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const [leftRes, rightRes] = await Promise.all([
          api.fetchListing(a),
          api.fetchListing(b),
        ]);
        if (!cancelled) {
          setLeft(leftRes.listing);
          setRight(rightRes.listing);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLeft(null);
          setRight(null);
          setError(err instanceof Error ? err.message : "Could not load listings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [a, b, hasPair]);

  const rows = useMemo(
    () => (left && right ? buildCompareRows(left, right) : []),
    [left, right],
  );
  const trumpRows = useMemo(
    () => (left && right ? buildCompareTrumpRows(left, right) : []),
    [left, right],
  );
  const titles = left && right ? compareTitles(left, right) : null;
  const leftChallenge = left
    ? listingChallengeAction({ ownerUserId: left.ownerUserId, viewerId: user?.id })
    : "hidden";
  const rightChallenge = right
    ? listingChallengeAction({ ownerUserId: right.ownerUserId, viewerId: user?.id })
    : "hidden";
  const leftTrade = left
    ? garageTradeOfferAction({ ownerUserId: left.ownerUserId, viewerId: user?.id })
    : "hidden";
  const rightTrade = right
    ? garageTradeOfferAction({ ownerUserId: right.ownerUserId, viewerId: user?.id })
    : "hidden";

  function onClearTray() {
    clearCompareSelection();
    setPicks([]);
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise">
          <p className="text-xs uppercase tracking-[0.28em] text-steel">
            Specs face-off · Midnight garage
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Compare
          </h1>
          <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
          <p className="mt-4 max-w-2xl text-sm text-steel">
            Pick two listings from{" "}
            <Link to="/cars" className="text-lime no-underline hover:underline">
              Cars
            </Link>
            {user ? (
              <>
                {" "}
                or{" "}
                <Link to="/favourites" className="text-lime no-underline hover:underline">
                  Favourites
                </Link>
              </>
            ) : null}
            , then open them side by side — studio photos first, Top Trumps category winners
            (Power / 0–60 / Top speed, same rules as Play), then Brad Coin price and key specs
            below.
          </p>
        </header>

        {!hasPair ? (
          <div
            className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="Empty compare bay"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">
              {picks.length >= 2
                ? "Ready to compare"
                : picks.length === 1
                  ? "Need one more car"
                  : "Empty bay"}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              {picks.length >= 2
                ? "Two cars are queued — open the side-by-side bay, or clear and pick again from Favourites or Cars."
                : picks.length === 1
                  ? "One car is queued. Tick a second from Favourites, or browse the catalogue and add another."
                  : "Compare needs two cars. Save a few to Favourites and tick exactly two, or pick from the catalogue."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {picks.length >= 2 ? (
                <Link
                  to={compareHref(picks)}
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                >
                  Open side-by-side
                </Link>
              ) : null}
              {user ? (
                <Link
                  to="/favourites"
                  className={
                    picks.length >= 2
                      ? "inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                      : "bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                  }
                >
                  Favourites
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                >
                  Sign in for Favourites
                </Link>
              )}
              <Link
                to="/cars"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Browse cars
              </Link>
              {picks.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearTray}
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist transition hover:border-rose hover:text-rose"
                >
                  Clear picks
                </button>
              ) : null}
            </div>
            {picks.length > 0 ? (
              <ul className="mx-auto mt-6 max-w-lg list-none space-y-2 border-t border-white/10 p-0 pt-4 text-left text-sm text-mist">
                {picks.map((pick) => (
                  <li key={pick.id}>
                    {listingTitle(pick)} · {formatCoins(pick.coinPrice)} ·{" "}
                    <Link to={`/cars/${pick.id}`} className="text-lime no-underline hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {loading && hasPair ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? (
          <p className="play-panel mt-6 rounded-md border border-rose/35 p-4 text-sm text-rose">
            {error}
          </p>
        ) : null}

        {left && right && titles ? (
          <div className="bay-rise-delay mt-8">
            <div
              role="region"
              aria-label="Compare car photos"
              className="compare-heroes grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-3"
            >
              <CompareCarPanel
                listingId={left.id}
                title={titles.left}
                year={left.year}
                colour={left.colour}
                bodyType={left.bodyType}
                make={left.make}
                model={left.model}
                coinPrice={left.coinPrice}
                detail={left.trimName ? left.trimName : undefined}
                ownerLabel={left.ownerLabel}
                openMemberHref={compareOpenMemberHref(left.ownerUserId, user?.id ?? null)}
                challengeHref={
                  leftChallenge === "challenge" && left.ownerUserId != null
                    ? listingChallengeHref(left.ownerUserId, left.id)
                    : null
                }
                tradeHref={
                  leftTrade === "offer" && left.ownerUserId != null
                    ? garageTradeOfferHref(left.ownerUserId, left.id)
                    : null
                }
                signInHref={
                  leftChallenge === "signin" || leftTrade === "signin" ? "/signin" : null
                }
              />
              <p
                className="hidden self-center text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-steel sm:block"
                aria-hidden
              >
                vs
              </p>
              <CompareCarPanel
                listingId={right.id}
                title={titles.right}
                year={right.year}
                colour={right.colour}
                bodyType={right.bodyType}
                make={right.make}
                model={right.model}
                coinPrice={right.coinPrice}
                detail={right.trimName ? right.trimName : undefined}
                ownerLabel={right.ownerLabel}
                openMemberHref={compareOpenMemberHref(right.ownerUserId, user?.id ?? null)}
                challengeHref={
                  rightChallenge === "challenge" && right.ownerUserId != null
                    ? listingChallengeHref(right.ownerUserId, right.id)
                    : null
                }
                tradeHref={
                  rightTrade === "offer" && right.ownerUserId != null
                    ? garageTradeOfferHref(right.ownerUserId, right.id)
                    : null
                }
                signInHref={
                  rightChallenge === "signin" || rightTrade === "signin" ? "/signin" : null
                }
              />
            </div>

            <CompareTrumpWinnersStrip
              rows={trumpRows}
              leftTitle={titles.left}
              rightTitle={titles.right}
            />

            <section
              className="play-panel bay-rise-delay mt-8 overflow-x-auto rounded-md border p-4 sm:p-5"
              aria-labelledby="compare-specs-heading"
            >
              <h2 id="compare-specs-heading" className="font-display text-xl text-mist">
                Specs
              </h2>
              <p className="mt-1 text-sm text-steel">
                Lime highlights the stronger value (or lower Brad Coin price / mileage / 0–60). Top
                Trumps Power / 0–60 / Top speed winners also sit above.
              </p>
              <table className="mt-4 w-full min-w-[28rem] border-collapse text-left text-sm">
                <caption className="sr-only">Side-by-side listing comparison</caption>
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-steel">
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Spec
                    </th>
                    <th scope="col" className="py-2 px-2 font-normal">
                      {titles.left}
                    </th>
                    <th scope="col" className="py-2 pl-2 font-normal">
                      {titles.right}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <th scope="row" className="py-3 pr-3 font-normal text-steel">
                        {row.label}
                      </th>
                      <td className={`py-3 px-2 ${cellClass("left", row.highlight)}`}>
                        {row.left}
                      </td>
                      <td className={`py-3 pl-2 ${cellClass("right", row.highlight)}`}>
                        {row.right}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <div
              role="region"
              className="play-panel mt-6 flex flex-wrap gap-3 rounded-md border p-4 sm:p-5"
              aria-label="Compare actions"
            >
              <CopyShareLinkButton
                path={compareSharePath(left.id, right.id)}
                label="Copy compare link"
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
              />
              <Link
                to="/cars"
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Back to Cars
              </Link>
              {user ? (
                <Link
                  to="/favourites"
                  className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                >
                  Favourites
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClearTray}
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist transition hover:border-rose hover:text-rose"
              >
                Clear picks
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
