import { Link } from "react-router-dom";
import { formatCoins } from "../cars";
import {
  garageBayOwnedCountLabel,
  garageBayValueLabel,
  garageBayValueStats,
} from "../garage-value";

type GarageBayValueStripProps = {
  /** Currently held garage cars (owned + for sale). Do not pass sold history. */
  cars: Array<{ coinPrice: number }>;
};

export function GarageBayValueStrip({ cars }: GarageBayValueStripProps) {
  const { ownedCount, totalValue } = garageBayValueStats(cars);
  const valueLabel = garageBayValueLabel(totalValue, formatCoins);
  const countLabel = garageBayOwnedCountLabel(ownedCount);

  return (
    <section
      className="play-panel bay-rise-delay mt-10 rounded-md border p-4 sm:p-5"
      aria-label="Garage bay value"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-steel">
            Bay value · Brad Coins
          </p>
          <h2 className="mt-1 font-display text-lg text-mist sm:text-xl">{valueLabel}</h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">{countLabel}</p>
          <p className="mt-1 text-xs text-steel">
            List / fair price on cars you hold now — sold history stays out of the total.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/cars"
            className="rounded-md border border-lime/40 bg-lime/10 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/15"
          >
            Browse cars
          </Link>
          <Link
            to="/how-to#garage-bay-value"
            className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
          >
            How to
          </Link>
        </div>
      </div>
    </section>
  );
}
