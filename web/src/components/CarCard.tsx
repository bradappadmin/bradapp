import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { carBadgeLabel, type CarBadgeKind } from "../car-visuals";
import { formatCoins, listingTitle } from "../cars";
import { trumpStatsPeek } from "../trump-stats-peek";
import { CarVisual } from "./CarVisual";

export type CarCardData = {
  id: number;
  make: string;
  model: string;
  trimName?: string;
  bodyType?: string;
  colour: string;
  year: number;
  fuel?: string;
  bhp?: number;
  topSpeedMph?: number;
  zeroToSixtySecs?: number;
  coinPrice?: number;
  status?: string;
};

type CarCardProps = {
  car: CarCardData;
  /** Visual badge on the right / top. */
  badge?: CarBadgeKind;
  /** Optional link target; omit for non-linking previews (e.g. play picks). */
  to?: string;
  /** Compact denser layout for play/select strips. */
  dense?: boolean;
  /**
   * `media` = photo-first catalogue card (large realistic image).
   * `row` = classic side-by-side (default; also used when dense).
   */
  layout?: "row" | "media";
  /** Extra footer (garage sell controls, etc.). */
  footer?: ReactNode;
  className?: string;
};

function SpecPills({ car }: { car: CarCardData }) {
  const pills: Array<{ label: string; value: string }> = [];
  if (car.bhp != null) pills.push({ label: "BHP", value: String(car.bhp) });
  if (car.zeroToSixtySecs != null) {
    pills.push({ label: "0–60", value: `${car.zeroToSixtySecs}s` });
  }
  if (car.topSpeedMph != null) {
    pills.push({ label: "Top", value: `${car.topSpeedMph} mph` });
  }
  if (pills.length === 0) return null;
  return (
    <dl className="mt-2 flex flex-wrap gap-2">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className="rounded-md border border-white/10 bg-bay-deep/60 px-2.5 py-1"
        >
          <dt className="text-[10px] uppercase tracking-wide text-steel">{pill.label}</dt>
          <dd className="font-display text-sm font-semibold text-mist">{pill.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tight Top Trumps peek under the studio photo on catalogue media cards. */
function TrumpStatsPeek({ car }: { car: CarCardData }) {
  const stats = trumpStatsPeek(car);
  if (stats.length === 0) return null;
  const cols =
    stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <dl
      className={`grid ${cols} gap-px border-t border-white/8 bg-white/[0.04]`}
      aria-label="Top Trumps peek"
    >
      {stats.map((stat) => (
        <div key={stat.id} className="bg-bay-deep/70 px-2 py-1.5 text-center sm:px-2.5 sm:py-2">
          <dt className="text-[10px] uppercase tracking-wide text-steel">{stat.label}</dt>
          <dd className="mt-0.5 font-display text-xs font-semibold text-mist sm:text-sm">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Badge({ kind, coinPrice }: { kind: CarBadgeKind; coinPrice?: number }) {
  const priceLabel = coinPrice != null ? formatCoins(coinPrice) : undefined;
  const label = carBadgeLabel(kind, priceLabel);
  const tone =
    kind === "owned"
      ? "text-steel border-white/15 bg-bay-deep/70"
      : kind === "sold"
        ? "text-steel border-white/10 bg-bay-deep/70"
        : "text-lime border-lime/40 bg-bay-deep/80";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 font-display text-sm font-semibold backdrop-blur-sm ${tone}`}
    >
      {label}
    </span>
  );
}

export function CarCard({
  car,
  badge,
  to,
  dense,
  layout = "row",
  footer,
  className = "",
}: CarCardProps) {
  const title = listingTitle({
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
  });
  const useMedia = layout === "media" && !dense;

  const meta = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`font-display font-semibold text-mist ${
              dense
                ? "text-base"
                : useMedia
                  ? "text-base sm:text-lg group-hover:text-white"
                  : "text-lg group-hover:text-white"
            }`}
          >
            {title}
          </p>
          <p className={`mt-0.5 text-steel ${useMedia ? "text-xs sm:text-sm" : "text-sm"}`}>
            {car.year}
            {car.bodyType ? ` · ${car.bodyType}` : ""} · {car.colour}
          </p>
        </div>
        {badge && !useMedia ? <Badge kind={badge} coinPrice={car.coinPrice} /> : null}
      </div>
      {!dense && !useMedia ? <SpecPills car={car} /> : null}
      {dense && (car.bhp != null || car.zeroToSixtySecs != null) ? (
        <p className="mt-1 text-xs text-steel">
          {car.bhp != null ? `${car.bhp} bhp` : null}
          {car.bhp != null && car.zeroToSixtySecs != null ? " · " : null}
          {car.zeroToSixtySecs != null ? `0–60 ${car.zeroToSixtySecs}s` : null}
          {car.topSpeedMph != null ? ` · ${car.topSpeedMph} mph` : null}
        </p>
      ) : null}
    </>
  );

  const main = useMedia ? (
    <div>
      <div className="relative">
        <CarVisual
          colour={car.colour}
          bodyType={car.bodyType}
          make={car.make}
          model={car.model}
          year={car.year}
          fuel={car.fuel}
          size="card"
          title={title}
          className="aspect-[3/2] w-full sm:aspect-[16/10]"
        />
        {badge ? (
          <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
            <Badge kind={badge} coinPrice={car.coinPrice} />
          </div>
        ) : null}
      </div>
      <TrumpStatsPeek car={car} />
      <div className="border-t border-white/8 px-3 py-2.5 sm:px-3.5 sm:py-3">{meta}</div>
    </div>
  ) : (
    <div className={`flex gap-3 ${dense ? "items-center" : "items-start"}`}>
      <CarVisual
        colour={car.colour}
        bodyType={car.bodyType}
        make={car.make}
        model={car.model}
        year={car.year}
        fuel={car.fuel}
        size="thumb"
        className={dense ? "h-16 w-28" : "h-24 w-36 sm:h-28 sm:w-44"}
      />
      <div className="min-w-0 flex-1">{meta}</div>
    </div>
  );

  const shellClass = useMedia
    ? `overflow-hidden rounded-md border border-white/10 bg-bay-deep/40 ${className}`
    : `rounded-md border border-white/10 bg-bay-panel/40 p-3 sm:p-4 ${className}`;

  if (to && !footer) {
    return (
      <Link
        to={to}
        className={`group block no-underline transition hover:border-lime/35 hover:bg-bay-panel/80 ${shellClass}`}
      >
        {main}
      </Link>
    );
  }

  return (
    <div className={shellClass}>
      {to ? (
        <Link to={to} className="group block no-underline">
          {main}
        </Link>
      ) : (
        main
      )}
      {footer ? <div className={useMedia ? "px-3 pb-3 sm:px-4 sm:pb-4" : undefined}>{footer}</div> : null}
    </div>
  );
}

/** Full-bleed bay plane + realistic studio photo (SVG fallback) for listing detail. */
export function CarHeroVisual({
  colour,
  bodyType,
  make,
  model,
  year,
  fuel,
  title,
  className = "",
}: {
  colour: string;
  bodyType?: string;
  make?: string;
  model?: string;
  year?: number;
  fuel?: string;
  title: string;
  className?: string;
}) {
  return (
    <CarVisual
      colour={colour}
      bodyType={bodyType}
      make={make}
      model={model}
      year={year}
      fuel={fuel}
      size="hero"
      title={title}
      className={className}
    />
  );
}
