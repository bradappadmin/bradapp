import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import type { ActivityItem, ActivityKind } from "../api";
import { listingTitle } from "../cars";
import { CarVisual } from "./CarVisual";

export type ActivityFilterId = "all" | "buys" | "trades" | "gifts" | "play" | "reviews";

const FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buys", label: "Buys" },
  { id: "trades", label: "Trades" },
  { id: "gifts", label: "Gifts" },
  { id: "play", label: "Play" },
  { id: "reviews", label: "Reviews" },
];

/** Map chip → activity kinds (Buys covers purchase + sale commerce). */
export function activityKindsForFilter(filter: ActivityFilterId): ActivityKind[] | null {
  switch (filter) {
    case "all":
      return null;
    case "buys":
      return ["purchase", "sale"];
    case "trades":
      return ["trade"];
    case "gifts":
      return ["gift"];
    case "play":
      return ["top_trumps"];
    case "reviews":
      return ["review"];
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function filterActivityItems(
  items: ActivityItem[],
  filter: ActivityFilterId,
): ActivityItem[] {
  const kinds = activityKindsForFilter(filter);
  if (kinds == null) return items;
  return items.filter((item) => kinds.includes(item.kind));
}

function kindLabel(kind: ActivityKind): string {
  switch (kind) {
    case "purchase":
      return "Buy";
    case "sale":
      return "Sell";
    case "trade":
      return "Trade";
    case "gift":
      return "Gift";
    case "top_trumps":
      return "Play";
    case "review":
      return "Review";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function kindTone(kind: ActivityKind): string {
  switch (kind) {
    case "purchase":
      return "border-rose/35 text-rose";
    case "sale":
      return "border-lime/40 text-lime";
    case "trade":
      return "border-mist/30 text-mist";
    case "gift":
      return "border-lime/45 text-lime";
    case "top_trumps":
      return "border-lime/35 text-lime";
    case "review":
      return "border-rose/30 text-mist";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityFilterId>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchActivity(25);
        if (!cancelled) {
          setItems(res.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = filterActivityItems(items, filter);

  return (
    <section
      className="bay-rise-delay mt-12 border-t border-white/10 pt-10"
      aria-label="Family activity"
    >
      <h2 className="font-display text-xl font-semibold text-mist sm:text-2xl">Family activity</h2>
      <p className="mt-2 text-sm text-steel">
        Recent buys, sells, free card trades, Brad Coin gifts, Top Trumps results, and published
        reviews — with a studio thumb when a car is in the story.
      </p>

      <fieldset className="mt-5">
        <legend className="font-display text-xs uppercase tracking-wide text-steel">
          Filter by type
        </legend>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Activity type">
          {FILTERS.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(chip.id)}
                className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                  active
                    ? "border-lime/50 bg-lime/10 text-lime"
                    : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {loading ? <p className="mt-6 text-sm text-steel">Loading…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {visible.map((item) => {
          const car = item.car;
          const carTitle = car
            ? listingTitle({ make: car.make, model: car.model, trimName: car.trimName })
            : null;
          const body = (
            <>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {car && carTitle ? (
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-bay-panel/60 sm:h-16 sm:w-28">
                    <CarVisual
                      colour={car.colour}
                      bodyType={car.bodyType}
                      make={car.make}
                      model={car.model}
                      size="thumb"
                      title={carTitle}
                      className="!h-full !w-full !rounded-none !border-0"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wide ${kindTone(item.kind)}`}
                  >
                    {kindLabel(item.kind)}
                  </span>
                  <p className="mt-2 font-display text-sm font-semibold text-mist">
                    {item.actorName}
                  </p>
                  {item.href ? (
                    <span className="mt-1 block text-sm text-steel group-hover:text-mist">
                      {item.summary}
                    </span>
                  ) : (
                    <p className="mt-1 text-sm text-steel">{item.summary}</p>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-xs text-steel sm:pt-1">{formatWhen(item.createdAt)}</p>
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  to={item.href}
                  className="group flex flex-col gap-2 rounded-md border border-white/10 bg-bay-panel/45 px-4 py-3 no-underline transition hover:border-white/20 hover:bg-bay-panel/70 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-bay-panel/45 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!loading && !error && items.length === 0 ? (
        <p className="mt-4 text-sm text-steel">
          Quiet bay for now — buy a car, trade a card, gift Brad Coins, play Top Trumps, or publish
          a review.
        </p>
      ) : null}
      {!loading && !error && items.length > 0 && visible.length === 0 ? (
        <p className="mt-4 text-sm text-steel" role="status">
          Nothing in this filter yet — try All, or another chip.
        </p>
      ) : null}
    </section>
  );
}
