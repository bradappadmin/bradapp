import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import * as api from "../api";
import type { MemberProfileCar, MemberSummary } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function MemberProfilePage() {
  const { id } = useParams();
  const memberId = Number(id);
  const { user, loading: authLoading } = useAuth();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [cars, setCars] = useState<MemberProfileCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !Number.isFinite(memberId) || memberId <= 0) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchMemberProfile(memberId);
        if (!cancelled) {
          setMember(res.member);
          setCars(res.cars);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, memberId]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  if (!Number.isFinite(memberId) || memberId <= 0) {
    return <Navigate to="/members" replace />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm text-steel">
          <Link to="/members" className="text-lime no-underline hover:underline">
            ← Members
          </Link>
        </p>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}

        {member ? (
          <div className="bay-rise mt-6">
            <h1 className="font-display text-3xl font-semibold text-white">{member.displayName}</h1>
            <p className="mt-2 text-sm text-steel">{member.roleLabel}</p>
            <p className="mt-4 font-display text-2xl text-lime">{formatCoins(member.coinBalance)}</p>
            <p className="mt-2 text-sm text-steel">
              {member.carCount} {member.carCount === 1 ? "car" : "cars"} in the bay
            </p>
            {user && member.id !== user.id && member.carCount > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/play?opponent=${member.id}`}
                  className="inline-block rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline hover:brightness-110"
                >
                  Challenge to Top Trumps
                </Link>
                <Link
                  to={`/trades?with=${member.id}`}
                  className="inline-block rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline hover:bg-lime/10"
                >
                  Offer free trade
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-xl text-mist">Cars</h2>
          {cars.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">Empty garage.</p>
          ) : null}
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {cars.map((car) => (
              <li key={car.id} className="py-4">
                <p className="font-display text-lg text-mist">
                  {car.make} {car.model}{" "}
                  <span className="text-sm text-steel">{car.trimName}</span>
                </p>
                <p className="mt-1 text-sm text-steel">
                  {car.year} · {car.colour} · {car.bhp} bhp · {car.topSpeedMph} mph · 0–60{" "}
                  {car.zeroToSixtySecs}s
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
