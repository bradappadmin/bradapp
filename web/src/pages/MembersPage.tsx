import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import type { MemberSummary } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Members</h1>
          <p className="mt-2 text-sm text-steel">
            Public garages in the bay — name, Brad Coins, and car count. Open a garage to see their
            cars, then challenge or offer a free trade when signed in.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {members.map((member) => {
            const isYou = Boolean(user && member.id === user.id);
            const canAct = Boolean(user && !isYou && member.carCount > 0);
            return (
              <li
                key={member.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    to={`/members/${member.id}`}
                    className="font-display text-lg font-semibold text-mist no-underline hover:text-white"
                  >
                    {member.displayName}
                    {isYou ? " (you)" : ""}
                  </Link>
                  <p className="mt-1 text-sm text-steel">{member.roleLabel}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-display text-lime">{formatCoins(member.coinBalance)}</span>
                  <span className="text-steel">
                    {member.carCount} {member.carCount === 1 ? "car" : "cars"}
                  </span>
                  <Link
                    to={`/members/${member.id}`}
                    className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline hover:border-lime/40 hover:text-lime"
                  >
                    Open garage
                  </Link>
                  {canAct ? (
                    <>
                      <Link
                        to={`/play?opponent=${member.id}`}
                        className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-sm text-lime no-underline hover:bg-lime/10"
                      >
                        Challenge
                      </Link>
                      <Link
                        to={`/trades?with=${member.id}`}
                        className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline hover:border-lime/40 hover:text-lime"
                      >
                        Trade
                      </Link>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
