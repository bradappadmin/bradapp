import { Link } from "react-router-dom";
import { formatCoins } from "../cars";
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
  signInHref,
}: CompareCarPanelProps) {
  const showChallenge = Boolean(challengeHref);
  const showTrade = Boolean(tradeHref);
  const showSignIn = !showChallenge && !showTrade && Boolean(signInHref);

  return (
    <article className="overflow-hidden rounded-md border border-white/10 bg-bay-deep/40">
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
        {showChallenge || showTrade || showSignIn ? (
          <div className="flex flex-wrap gap-2 pt-2" aria-label={`${title} play actions`}>
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
