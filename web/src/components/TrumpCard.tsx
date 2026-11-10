import { listingTitle } from "../cars";
import { CarVisual } from "./CarVisual";

export type TrumpCardData = {
  make: string;
  model: string;
  trimName?: string;
  bodyType?: string;
  colour: string;
  year?: number | null;
  bhp?: number;
  topSpeedMph?: number;
  zeroToSixtySecs?: number;
};

type TrumpCardProps = {
  car: TrumpCardData;
  /** Corner / caption label — "You", "House", rival name, etc. */
  label: string;
  /** Highlight the winning side after a match. */
  highlighted?: boolean;
  /** Stat value shown under the photo when comparing. */
  statLabel?: string;
  statValue?: string | number;
  className?: string;
};

/** Photo-first Top Trumps face — studio render with Midnight Garage frame. */
export function TrumpCard({
  car,
  label,
  highlighted = false,
  statLabel,
  statValue,
  className = "",
}: TrumpCardProps) {
  const title = listingTitle({
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
  });

  return (
    <article
      className={`overflow-hidden rounded-md border bg-bay-deep/40 ${
        highlighted ? "border-lime/50 shadow-[0_0_24px_rgba(163,230,53,0.12)]" : "border-white/10"
      } ${className}`}
    >
      <div className="relative">
        <CarVisual
          colour={car.colour}
          bodyType={car.bodyType}
          make={car.make}
          model={car.model}
          year={car.year ?? undefined}
          size="card"
          title={title}
          className="aspect-[3/2] w-full"
        />
        <p className="absolute left-2 top-2 rounded-md border border-white/15 bg-bay-deep/85 px-2 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-mist backdrop-blur-sm">
          {label}
        </p>
      </div>
      <div className="space-y-0.5 border-t border-white/8 px-3 py-2.5">
        <p className="font-display text-sm font-semibold text-mist sm:text-base">{title}</p>
        <p className="text-xs text-steel">
          {car.year != null ? `${car.year} · ` : ""}
          {car.bodyType ? `${car.bodyType} · ` : ""}
          {car.colour}
        </p>
        {car.bhp != null || car.zeroToSixtySecs != null || car.topSpeedMph != null ? (
          <p className="text-xs text-steel">
            {car.bhp != null ? `${car.bhp} bhp` : null}
            {car.bhp != null && car.zeroToSixtySecs != null ? " · " : null}
            {car.zeroToSixtySecs != null ? `0–60 ${car.zeroToSixtySecs}s` : null}
            {car.topSpeedMph != null ? ` · ${car.topSpeedMph} mph` : null}
          </p>
        ) : null}
        {statLabel != null && statValue != null ? (
          <p className="pt-1 font-display text-sm font-semibold text-lime">
            {statLabel}: {statValue}
          </p>
        ) : null}
      </div>
    </article>
  );
}
