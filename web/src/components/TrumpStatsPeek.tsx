import { trumpStatsPeek, type TrumpStatsCar } from "../trump-stats-peek";

/** Tight Top Trumps peek under a studio photo (Power / 0–60 / Top speed). */
export function TrumpStatsPeek({ car }: { car: TrumpStatsCar }) {
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
