import { Link } from "react-router-dom";
import { formatCoins } from "../cars";
import { compareOpenCarAriaLabel, compareOpenCarHref } from "../compare-open-car";
import { CarVisual } from "./CarVisual";

type CompareCarPanelProps = {
  listingId: number;
  title: string;
  year: number;
  colour: string;
  bodyType?: string;
  make: string;
  model: string;
  coinPrice: number;
  /** Optional short caption under the photo (trim / colour). */
  detail?: string;
  /** Play deep-link when this side’s owner is challengeable; omit to hide. */
  challengeHref?: string | null;
  /** Trades deep-link when this side’s owner is tradeable; omit to hide. */
  tradeHref?: string | null;
  /** Public garage deep-link when this side’s owner is a known member; omit to hide. */
  openMemberHref?: string | null;
  /** Optional owner display name for Open member aria. */
  ownerLabel?: string | null;
  /** Sign-in prompt when a member owns this side but the viewer is signed out. */
  signInHref?: string | null;
};

/** Large photo-first panel for one side of a listing compare. */
export function CompareCarPanel({
  listingId,
  title,
  year,
  colour,
  bodyType,
  make,
  model,
  coinPrice,
  detail,
  challengeHref,
  tradeHref,
  openMemberHref,
  ownerLabel,
  signInHref,
}: CompareCarPanelProps) {
  const openCarHref = compareOpenCarHref(listingId);
  const showOpenCar = Boolean(openCarHref);
  const showChallenge = Boolean(challengeHref);
  const showTrade = Boolean(tradeHref);
  const showOpenMember = Boolean(openMemberHref);
  const showSignIn = !showChallenge && !showTrade && Boolean(signInHref);
  const openMemberAria = ownerLabel
    ? `Open member ${ownerLabel}`
    : `Open member ${title}`;

  return (
    <article
      className="compare-hero-motion overflow-hidden rounded-md border border-white/10 bg-bay-deep/40"
      data-compare-hero
    >
      <CarVisual
        colour={colour}
        bodyType={bodyType}
        make={make}
        model={model}
        year={year}
        size="hero"
        title={title}
        className="!mt-0 border-0 sm:rounded-none"
      />
      <div className="space-y-1 border-t border-white/8 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          to={`/cars/${listingId}`}
          className="font-display text-base font-semibold text-mist no-underline hover:text-lime sm:text-lg"
        >
          {title}
        </Link>
        <p className="text-xs text-steel sm:text-sm">
          {year}
          {bodyType ? ` · ${bodyType}` : ""} · {colour}
        </p>
        {detail ? <p className="text-xs text-steel">{detail}</p> : null}
        <p className="pt-0.5 font-display text-lg font-semibold text-lime sm:text-xl">
          {formatCoins(coinPrice)}
        </p>
        {showOpenCar || showChallenge || showTrade || showOpenMember || showSignIn ? (
          <div className="flex flex-wrap gap-2 pt-2" aria-label={`${title} play actions`}>
            {showOpenCar && openCarHref ? (
              <Link
                to={openCarHref}
                aria-label={compareOpenCarAriaLabel(title)}
                className="inline-flex rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Open car
              </Link>
            ) : null}
            {showOpenMember && openMemberHref ? (
              <Link
                to={openMemberHref}
                aria-label={openMemberAria}
                className="inline-flex rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Open member
              </Link>
            ) : null}
            {showChallenge && challengeHref ? (
              <Link
                to={challengeHref}
                aria-label={`Challenge to Top Trumps ${title}`}
                className="inline-flex rounded-md border border-lime/40 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Challenge
              </Link>
            ) : null}
            {showTrade && tradeHref ? (
              <Link
                to={tradeHref}
                aria-label={`Offer trade ${title}`}
                className="inline-flex rounded-md border border-white/15 px-3 py-1.5 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Offer trade
              </Link>
            ) : null}
            {showSignIn && signInHref ? (
              <Link
                to={signInHref}
                aria-label={`Sign in to challenge or trade ${title}`}
                className="inline-flex rounded-md border border-lime/40 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Sign in to challenge or trade
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
