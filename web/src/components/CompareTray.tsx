import { Link } from "react-router-dom";
import {
  clearCompareSelection,
  compareHref,
  type ComparePick,
} from "../compare-selection";
import { formatCoins, listingTitle } from "../cars";

type CompareTrayProps = {
  picks: ComparePick[];
  onChange: (picks: ComparePick[]) => void;
};

export function CompareTray({ picks, onChange }: CompareTrayProps) {
  if (picks.length === 0) return null;

  function onClear() {
    clearCompareSelection();
    onChange([]);
  }

  return (
    <div
      className="sticky bottom-3 z-30 mt-8 rounded-md border border-lime/30 bg-bay-deep/95 p-3 shadow-lg backdrop-blur-sm sm:p-4"
      role="region"
      aria-label="Compare selection"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-lime">
            Compare ({picks.length}/2)
          </p>
          <ul className="mt-1 list-none space-y-0.5 p-0 text-sm text-mist">
            {picks.map((pick) => (
              <li key={pick.id} className="truncate">
                {listingTitle(pick)} · {formatCoins(pick.coinPrice)}
              </li>
            ))}
          </ul>
          {picks.length === 1 ? (
            <p className="mt-1 text-xs text-steel">Pick one more from Cars or Favourites.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-white/15 px-3 py-2 font-display text-xs font-semibold text-mist transition hover:border-rose hover:text-rose"
          >
            Clear
          </button>
          {picks.length === 2 ? (
            <Link
              to={compareHref(picks)}
              className="rounded-md bg-rose px-3 py-2 font-display text-xs font-semibold text-white no-underline transition hover:brightness-110"
            >
              Side by side
            </Link>
          ) : (
            <span className="rounded-md border border-white/10 px-3 py-2 font-display text-xs font-semibold text-steel">
              Side by side
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
