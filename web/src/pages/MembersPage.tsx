import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { MemberSummary } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchMembers();
        if (!cancelled) {
          setMembers(res.members);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Members</h1>
          <p className="mt-2 text-sm text-steel">
            Who’s in the bay — name, role, Brad Coins, and how many cars they hold. Challenge someone
            from Play.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {members.map((member) => (
            <li key={member.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link
                  to={`/members/${member.id}`}
                  className="font-display text-lg font-semibold text-mist no-underline hover:text-white"
                >
                  {member.displayName}
                  {user && member.id === user.id ? " (you)" : ""}
                </Link>
                <p className="mt-1 text-sm text-steel">{member.roleLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-display text-lime">{formatCoins(member.coinBalance)}</span>
                <span className="text-steel">
                  {member.carCount} {member.carCount === 1 ? "car" : "cars"}
                </span>
                {user && member.id !== user.id && member.carCount > 0 ? (
                  <Link
                    to={`/play?opponent=${member.id}`}
                    className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-sm text-lime no-underline hover:bg-lime/10"
                  >
                    Challenge
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
