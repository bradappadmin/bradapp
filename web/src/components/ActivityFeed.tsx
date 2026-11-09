import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import type { ActivityItem, ActivityKind } from "../api";

function kindLabel(kind: ActivityKind): string {
  switch (kind) {
    case "purchase":
      return "Buy";
    case "sale":
      return "Sell";
    case "trade":
      return "Trade";
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

  return (
    <section
      className="bay-rise-delay mt-12 border-t border-white/10 pt-10"
      aria-label="Family activity"
    >
      <h2 className="font-display text-xl font-semibold text-mist sm:text-2xl">Family activity</h2>
      <p className="mt-2 text-sm text-steel">
        Recent buys, sells, free card trades, Top Trumps results, and published reviews.
      </p>

      {loading ? <p className="mt-6 text-sm text-steel">Loading…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-md border border-white/10 bg-bay-panel/45 px-4 py-3 transition hover:border-white/20 hover:bg-bay-panel/70"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-md border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wide ${kindTone(item.kind)}`}
                >
                  {kindLabel(item.kind)}
                </span>
                {item.href ? (
                  <Link
                    to={item.href}
                    className="mt-2 block text-sm text-mist no-underline hover:text-white"
                  >
                    {item.summary}
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-mist">{item.summary}</p>
                )}
                <p className="mt-1 text-xs text-steel">{item.actorName}</p>
              </div>
              <p className="shrink-0 text-xs text-steel">{formatWhen(item.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>

      {!loading && !error && items.length === 0 ? (
        <p className="mt-4 text-sm text-steel">
          Quiet bay for now — buy a car, trade a card, play Top Trumps, or publish a review.
        </p>
      ) : null}
    </section>
  );
}
