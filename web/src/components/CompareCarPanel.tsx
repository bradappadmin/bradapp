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
      </div>
    </article>
  );
}
