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
    <section className="mt-16 border-t border-white/10 pt-10">
      <h2 className="font-display text-2xl font-semibold text-white">Family activity</h2>
      <p className="mt-2 text-sm text-steel">
        Recent buys, sells, free card trades, Top Trumps results, and published reviews.
      </p>

      {loading ? <p className="mt-6 text-sm text-steel">Loading…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

      <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel">{kindLabel(item.kind)}</p>
              {item.href ? (
                <Link to={item.href} className="mt-1 block text-sm text-mist no-underline hover:text-white">
                  {item.summary}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-mist">{item.summary}</p>
              )}
            </div>
            <p className="shrink-0 text-xs text-steel">{formatWhen(item.createdAt)}</p>
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
