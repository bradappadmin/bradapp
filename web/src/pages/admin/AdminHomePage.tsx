import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import type { AdminHomeStats } from "../../api";
import { useAuth } from "../../auth-context";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { roleLabel } from "../../types";

const SECTIONS = [
  {
    to: "/admin/users",
    title: "Accounts",
    body: "List members, correct names, freeze or close accounts, adjust Brad Coins.",
  },
  {
    to: "/admin/invites",
    title: "Family invites",
    body: "Create, copy, and revoke optional signup invite codes.",
  },
  {
    to: "/admin/coin-history",
    title: "Coin adjustments",
    body: "Who changed which balance, by how much, when, and the note.",
  },
  {
    to: "/admin/inventory",
    title: "Cars & garages",
    body: "Edit models, listings, and garage details.",
  },
  {
    to: "/reviews",
    title: "Reviews",
    body: "Record or take down bay videos.",
  },
] as const;

type StatChip = {
  key: keyof AdminHomeStats;
  label: string;
  to: string;
  tone: "lime" | "rose" | "mist";
};

const STAT_CHIPS: StatChip[] = [
  { key: "memberAccounts", label: "Member accounts", to: "/admin/users", tone: "lime" },
  { key: "frozenAccounts", label: "Frozen accounts", to: "/admin/users", tone: "rose" },
  { key: "listingsForSale", label: "Listings for sale", to: "/admin/inventory", tone: "lime" },
  { key: "pendingTradeOffers", label: "Pending trades", to: "/trades", tone: "mist" },
  { key: "publishedReviews", label: "Published reviews", to: "/reviews", tone: "mist" },
];

function chipClass(tone: StatChip["tone"]): string {
  switch (tone) {
    case "lime":
      return "border-lime/35 bg-lime/10 text-lime hover:border-lime/55 hover:bg-lime/15";
    case "rose":
      return "border-rose/40 bg-rose/10 text-rose hover:border-rose/55 hover:bg-rose/15";
    case "mist":
      return "border-white/15 bg-bay-panel/60 text-mist hover:border-lime/35 hover:text-lime";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHomeInner />
    </AdminGuard>
  );
}

function AdminHomeInner() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminHomeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchAdminStats();
        if (!cancelled) {
          setStats(res.stats);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setStats(null);
          setError(err instanceof Error ? err.message : "Could not load admin stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      title="Admin"
      description={
        <>
          {user ? `${user.displayName} · ${roleLabel(user.role)}` : ""} — Brad and Napwood can
          correct accounts, stock, coins, and reviews. Members stay out.
        </>
      }
    >
      <section className="bay-rise-delay mt-8" aria-label="Admin quick stats">
        <p className="text-xs uppercase tracking-wide text-steel">Bay snapshot</p>
        {loading ? <p className="mt-3 text-sm text-steel">Loading stats…</p> : null}
        {error ? <p className="mt-3 text-sm text-rose">{error}</p> : null}
        {stats ? (
          <ul className="mt-3 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {STAT_CHIPS.map((chip) => (
              <li key={chip.key}>
                <Link
                  to={chip.to}
                  className={`play-panel flex h-full flex-col rounded-md border p-3 no-underline transition sm:p-4 ${chipClass(chip.tone)}`}
                >
                  <span className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">
                    {stats[chip.key]}
                  </span>
                  <span className="mt-1 text-xs text-steel sm:text-sm">{chip.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
        {SECTIONS.map((section) => (
          <li key={section.to} className="admin-row">
            <Link
              to={section.to}
              className="block py-5 text-mist no-underline transition hover:text-white"
            >
              <span className="font-display text-lg font-semibold">{section.title}</span>
              <span className="mt-1 block text-sm text-steel">{section.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
