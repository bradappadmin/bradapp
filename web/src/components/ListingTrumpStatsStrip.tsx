import { trumpStatsPeek, type TrumpStatsCar } from "../trump-stats-peek";

type ListingTrumpStatsStripProps = {
  car: TrumpStatsCar;
};

/**
 * One Top Trumps bay strip under the listing studio hero.
 * Same Power / 0–60 / Top speed as catalogue media peeks — not a stats dashboard.
 */
export function ListingTrumpStatsStrip({ car }: ListingTrumpStatsStripProps) {
  const stats = trumpStatsPeek(car);
  if (stats.length === 0) return null;

  const cols =
    stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <section
      className="play-panel bay-rise-delay mt-4 overflow-hidden rounded-md border sm:mt-5"
      aria-label="Top Trumps bay strip"
    >
      <div className="border-b border-white/8 px-4 py-2.5 sm:px-5">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Top Trumps · Play stats</p>
      </div>
      <dl className={`grid ${cols} gap-px bg-white/[0.04]`}>
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-bay-deep/70 px-3 py-3 text-center sm:px-4 sm:py-3.5"
          >
            <dt className="text-[10px] uppercase tracking-wide text-steel sm:text-xs">
              {stat.label}
            </dt>
            <dd className="mt-1 font-display text-base font-semibold text-mist sm:text-lg">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
