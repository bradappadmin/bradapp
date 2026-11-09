import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import * as api from "../api";
import type { MemberProfileCar, MemberSummary } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { badgeForStatus } from "../car-visuals";
import { CarCard } from "../components/CarCard";
import { SiteHeader } from "../components/SiteHeader";
import { garageTradeOfferAction, garageTradeOfferHref } from "../garage-trade-offer";

export function MemberProfilePage() {
  const { id } = useParams();
  const memberId = Number(id);
  const { user, loading: authLoading } = useAuth();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [cars, setCars] = useState<MemberProfileCar[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(memberId) || memberId <= 0) return;
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load garage");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (!Number.isFinite(memberId) || memberId <= 0) {
    return <Navigate to="/members" replace />;
  }

  const isSelf = Boolean(user && member && member.id === user.id);
  const canChallengeOrTrade = Boolean(user && member && !isSelf && member.carCount > 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm text-steel">
          <Link to="/members" className="text-lime no-underline hover:underline">
            ← Members
          </Link>
        </p>

        {loading || authLoading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}

        {member ? (
          <div className="bay-rise mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Public garage</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              {member.displayName}
              {isSelf ? " (you)" : ""}
            </h1>
            <p className="mt-2 text-sm text-steel">{member.roleLabel}</p>
            {member.bio ? (
              <p className="mt-4 max-w-2xl text-base text-mist">{member.bio}</p>
            ) : null}
            <p className="mt-5 font-display text-2xl text-lime sm:text-3xl">
              {formatCoins(member.coinBalance)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-steel">Brad Coin balance</p>
            <p className="mt-4 max-w-2xl text-sm text-steel">
              {member.carCount} {member.carCount === 1 ? "car" : "cars"} in the bay — studio photos
              of their garage, no account secrets.
            </p>

            {canChallengeOrTrade ? (
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

            {!user && !authLoading ? (
              <p className="mt-6 text-sm text-steel">
                <Link to="/signin" className="text-lime no-underline hover:underline">
                  Sign in
                </Link>{" "}
                to challenge or offer a free trade.
              </p>
            ) : null}

            {isSelf ? (
              <p className="mt-6 text-sm text-steel">
                This is how others see your bay. Edit your display name and bio in{" "}
                <Link to="/account" className="text-lime no-underline hover:underline">
                  Account
                </Link>
                , or manage listings in{" "}
                <Link to="/garage" className="text-lime no-underline hover:underline">
                  My cars
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <section className="mt-10" aria-label="Member garage cars">
          <h2 className="font-display text-xl text-mist">Garage</h2>
          {cars.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-steel">Empty garage.</p>
          ) : null}
          {cars.length > 0 ? (
            <ul className="mt-4 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((car) => {
                const tradeAction = member
                  ? garageTradeOfferAction({
                      ownerUserId: member.id,
                      viewerId: user?.id,
                    })
                  : "hidden";
                return (
                  <li key={car.id} className="bay-rise">
                    <CarCard
                      car={car}
                      to={`/cars/${car.id}`}
                      badge={badgeForStatus(car.status, "price")}
                      layout="media"
                      footer={
                        tradeAction === "offer" && member ? (
                          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                            <Link
                              to={garageTradeOfferHref(member.id, car.id)}
                              className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-xs font-semibold text-lime no-underline transition hover:bg-lime/10"
                            >
                              Offer trade
                            </Link>
                          </div>
                        ) : tradeAction === "signin" ? (
                          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                            <Link
                              to="/signin"
                              className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                            >
                              Sign in to offer trade
                            </Link>
                          </div>
                        ) : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </main>
    </div>
  );
}
