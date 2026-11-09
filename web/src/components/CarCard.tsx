import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  carBadgeLabel,
  carPaint,
  carSilhouettePath,
  type CarBadgeKind,
} from "../car-visuals";
import { formatCoins, listingTitle } from "../cars";

export type CarCardData = {
  id: number;
  make: string;
  model: string;
  trimName?: string;
  bodyType?: string;
  colour: string;
  year: number;
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

function Badge({ kind, coinPrice }: { kind: CarBadgeKind; coinPrice?: number }) {
  const priceLabel = coinPrice != null ? formatCoins(coinPrice) : undefined;
  const label = carBadgeLabel(kind, priceLabel);
  const tone =
    kind === "owned"
      ? "text-steel border-white/15"
      : kind === "sold"
        ? "text-steel border-white/10"
        : "text-lime border-lime/30";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 font-display text-sm font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function Visual({
  colour,
  bodyType,
  dense,
}: {
  colour: string;
  bodyType?: string;
  dense?: boolean;
}) {
  const paint = carPaint(colour);
  const path = carSilhouettePath(bodyType);
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md border border-white/10 ${
        dense ? "h-16 w-24" : "h-20 w-28 sm:h-24 sm:w-36"
      }`}
      style={{
        background: `linear-gradient(145deg, ${paint.glow}, transparent 55%), #0b1220`,
      }}
      aria-hidden
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: paint.fill }}
      />
      <svg
        viewBox="0 0 160 64"
        className={`absolute inset-x-1 bottom-0 top-1 h-auto w-auto ${dense ? "px-0.5" : "px-1"}`}
      >
        <path d={path} fill={paint.fill} opacity={0.92} />
        <ellipse cx="42" cy="48" rx="8" ry="8" fill="#070b14" opacity={0.85} />
        <ellipse cx="118" cy="48" rx="8" ry="8" fill="#070b14" opacity={0.85} />
      </svg>
    </div>
  );
}

export function CarCard({
  car,
  badge,
  to,
  dense,
  footer,
  className = "",
}: CarCardProps) {
  const title = listingTitle({
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
  });

  const main = (
    <div className={`flex gap-3 ${dense ? "items-center" : "items-start"}`}>
      <Visual colour={car.colour} bodyType={car.bodyType} dense={dense} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`font-display font-semibold text-mist ${
                dense ? "text-base" : "text-lg group-hover:text-white"
              }`}
            >
              {title}
            </p>
            <p className="mt-0.5 text-sm text-steel">
              {car.year}
              {car.bodyType ? ` · ${car.bodyType}` : ""} · {car.colour}
            </p>
          </div>
          {badge ? <Badge kind={badge} coinPrice={car.coinPrice} /> : null}
        </div>
        {!dense ? <SpecPills car={car} /> : null}
        {dense && (car.bhp != null || car.zeroToSixtySecs != null) ? (
          <p className="mt-1 text-xs text-steel">
            {car.bhp != null ? `${car.bhp} bhp` : null}
            {car.bhp != null && car.zeroToSixtySecs != null ? " · " : null}
            {car.zeroToSixtySecs != null ? `0–60 ${car.zeroToSixtySecs}s` : null}
            {car.topSpeedMph != null ? ` · ${car.topSpeedMph} mph` : null}
          </p>
        ) : null}
      </div>
    </div>
  );

  const shellClass = `rounded-md border border-white/10 bg-bay-panel/40 p-3 sm:p-4 ${className}`;

  if (to && !footer) {
    return (
      <Link
        to={to}
        className={`group block no-underline transition hover:border-lime/30 hover:bg-bay-panel/70 ${shellClass}`}
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
      {footer}
    </div>
  );
}

/** Full-bleed colour plane + silhouette for listing detail hero. */
export function CarHeroVisual({
  colour,
  bodyType,
  title,
}: {
  colour: string;
  bodyType?: string;
  title: string;
}) {
  const paint = carPaint(colour);
  const path = carSilhouettePath(bodyType);
  return (
    <div
      className="relative mt-6 overflow-hidden rounded-md border border-white/10"
      style={{
        background: `linear-gradient(120deg, ${paint.glow}, transparent 60%), linear-gradient(180deg, #121a2b, #070b14)`,
      }}
      role="img"
      aria-label={`${title} in ${colour}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-2 sm:w-3"
        style={{ backgroundColor: paint.fill }}
      />
      <div className="flex min-h-[9rem] items-end justify-center px-6 pb-4 pt-8 sm:min-h-[11rem]">
        <svg viewBox="0 0 160 64" className="h-20 w-full max-w-lg sm:h-24">
          <path d={path} fill={paint.fill} opacity={0.95} />
          <ellipse cx="42" cy="48" rx="9" ry="9" fill="#070b14" opacity={0.85} />
          <ellipse cx="118" cy="48" rx="9" ry="9" fill="#070b14" opacity={0.85} />
        </svg>
      </div>
    </div>
  );
}
