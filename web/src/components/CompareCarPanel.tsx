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
}: CompareCarPanelProps) {
  return (
    <article className="play-panel overflow-hidden rounded-md border">
      <div className="p-2 sm:p-3">
        <CarVisual
          colour={colour}
          bodyType={bodyType}
          make={make}
          model={model}
          year={year}
          size="hero"
          title={title}
          className="!mt-0 border-0"
        />
      </div>
      <div className="space-y-1 border-t border-white/10 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        <Link
          to={`/cars/${listingId}`}
          className="font-display text-lg font-semibold text-mist no-underline hover:text-lime sm:text-xl"
        >
          {title}
        </Link>
        <p className="text-sm text-steel">
          {year}
          {bodyType ? ` · ${bodyType}` : ""} · {colour}
        </p>
        {detail ? <p className="text-xs text-steel">{detail}</p> : null}
        <p className="pt-1 font-display text-xl font-semibold text-lime">
          {formatCoins(coinPrice)}
        </p>
      </div>
    </article>
  );
}
