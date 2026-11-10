import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { activityOpenCarHref, activityOpenCarLabel } from "../activity-open-car";
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
  const filterOn = filter !== "all";
  // Type chips stay while loading, when the bay has events, or while a chip filter is active.
  const showChips = loading || items.length > 0 || filterOn;
  const emptyBay = !loading && !error && items.length === 0;
  const emptyFilter = !loading && !error && items.length > 0 && visible.length === 0;

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

      {showChips ? (
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
      ) : null}

      {loading ? <p className="mt-6 text-sm text-steel">Loading…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

      {visible.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {visible.map((item) => {
            const car = item.car;
            const carTitle = car
              ? listingTitle({ make: car.make, model: car.model, trimName: car.trimName })
              : null;
            const openCarHref = activityOpenCarHref(item.listingId);
            const openCarAria =
              car && carTitle
                ? `${activityOpenCarLabel()} ${carTitle}`
                : activityOpenCarLabel();
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
                <div className="overflow-hidden rounded-md border border-white/10 bg-bay-panel/45 transition hover:border-white/20 hover:bg-bay-panel/70">
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="group flex flex-col gap-2 px-4 py-3 no-underline sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      {body}
                    </div>
                  )}
                  {openCarHref ? (
                    <div
                      className="flex flex-wrap gap-2 border-t border-white/8 px-4 pb-3"
                      aria-label="Related car actions"
                    >
                      <Link
                        to={openCarHref}
                        aria-label={openCarAria}
                        className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                      >
                        {activityOpenCarLabel()}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {emptyBay ? (
        <div
          className="play-panel mt-6 rounded-md border px-5 py-12 text-center sm:py-14"
          role="status"
          aria-label="Empty activity bay"
        >
          <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
            Quiet for now — buy a car, play Top Trumps, or see who’s around on Members to get the
            family feed moving.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/cars"
              className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Browse cars
            </Link>
            <Link
              to="/play"
              className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Play
            </Link>
            <Link
              to="/members"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Members
            </Link>
          </div>
        </div>
      ) : null}

      {emptyFilter ? (
        <div
          className="play-panel mt-6 rounded-md border px-5 py-12 text-center sm:py-14"
          role="status"
          aria-label="No matching activity"
        >
          <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
            Nothing in this type filter yet. Clear the filter for the full family feed, or browse
            cars, play, or Members.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
            >
              Clear filter
            </button>
            <Link
              to="/cars"
              className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Browse cars
            </Link>
            <Link
              to="/play"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Play
            </Link>
            <Link
              to="/members"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Members
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
