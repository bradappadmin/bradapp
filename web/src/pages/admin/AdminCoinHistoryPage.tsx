import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import type { AdminCoinAdjustment } from "../../api";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { formatCoins } from "../../cars";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDelta(delta: number): string {
  const abs = formatCoins(Math.abs(delta));
  return delta > 0 ? `+${abs}` : `−${abs}`;
}

export function AdminCoinHistoryPage() {
  return (
    <AdminGuard>
      <AdminCoinHistoryInner />
    </AdminGuard>
  );
}

function AdminCoinHistoryInner() {
  const [adjustments, setAdjustments] = useState<AdminCoinAdjustment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchAdminCoinAdjustments(80);
        if (!cancelled) {
          setAdjustments(res.adjustments);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load coin history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      wide
      title="Coin adjustments"
      description="Who changed which Brad Coin balance, by how much, when, and why. Admin corrections only — buys, play rewards, and daily bonuses stay on each member’s ledger."
    >
      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-steel">Loading…</p> : null}

      {!loading && adjustments.length === 0 ? (
        <p className="mt-8 text-sm text-steel">
          No admin adjustments yet. Correct a balance from{" "}
          <Link to="/admin/users" className="text-lime no-underline hover:underline">
            Accounts
          </Link>
          .
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
        {adjustments.map((row) => (
          <li key={row.id} className="admin-row grid gap-2 py-5 sm:grid-cols-[1.2fr_1fr]">
            <div className="min-w-0">
              <p className="font-display text-lg text-mist break-words">
                {row.userDisplayName}
                <span className="ml-2 text-sm font-normal text-steel">{row.userEmail}</span>
              </p>
              <p className="mt-1 text-sm text-steel">
                By {row.createdByDisplayName ?? "Unknown admin"} · {formatWhen(row.createdAt)}
              </p>
              {row.note ? <p className="mt-2 text-sm text-mist">{row.note}</p> : null}
            </div>
            <div className="sm:text-right">
              <p
                className={`font-display text-xl font-semibold ${
                  row.delta >= 0 ? "text-lime" : "text-rose"
                }`}
              >
                {formatDelta(row.delta)}
              </p>
              <p className="mt-1 text-sm text-steel">
                Balance after {formatCoins(row.balanceAfter)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
