import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { ActivityFeed } from "../components/ActivityFeed";
import { FeaturedReview } from "../components/FeaturedReview";
import { FirstVisitTips } from "../components/FirstVisitTips";
import { HomeBayAtmosphere } from "../components/HomeBayAtmosphere";
import { LatestReviews } from "../components/LatestReviews";
import { RecentlyViewedCars } from "../components/RecentlyViewedCars";
import { SiteHeader } from "../components/SiteHeader";
import { dailyLoginToastMessage } from "../daily-login-toast";
import { useToast } from "../toast-context";
import { roleLabel } from "../types";

const secondaryLinkClass =
  "font-display text-sm text-steel no-underline transition hover:text-lime";

export function HomePage() {
  const { user, loading, setUser, dailyLogin, refresh } = useAuth();
  const toast = useToast();
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimNote, setClaimNote] = useState<string | null>(null);
  const toastedClaimDate = useRef<string | null>(null);

  // Auto-claim lands via /auth/me on first signed-in load; toast once per London day.
  useEffect(() => {
    if (!dailyLogin?.claimedJustNow) return;
    if (toastedClaimDate.current === dailyLogin.claimDate) return;
    toastedClaimDate.current = dailyLogin.claimDate;
    toast.success(dailyLoginToastMessage(dailyLogin));
  }, [dailyLogin, toast]);

  async function onSignOut() {
    await api.signOut();
    setUser(null);
  }

  async function onClaimDaily() {
    setClaimBusy(true);
    setClaimNote(null);
    try {
      const res = await api.claimDailyBonus();
      setUser(res.user);
      await refresh();
      if (res.dailyLogin.claimedJustNow) {
        toastedClaimDate.current = res.dailyLogin.claimDate;
        toast.success(dailyLoginToastMessage(res.dailyLogin));
        const streak = res.dailyLogin.streak ?? 0;
        const streakBonus = res.dailyLogin.streakBonusAwarded ?? 0;
        const streakNote =
          streakBonus > 0
            ? ` · streak ×${streak} (+${streakBonus} BC)`
            : streak > 0
              ? ` · streak ×${streak}`
              : "";
        setClaimNote(
          `Claimed +${res.dailyLogin.amount} BC for ${res.dailyLogin.claimDate} (Europe/London)${streakNote}.`,
        );
      } else {
        setClaimNote(
          `Already claimed today’s +${res.dailyLogin.amount} BC (${res.dailyLogin.claimDate} Europe/London).`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not claim daily bonus";
      setClaimNote(msg);
      toast.error(msg);
    } finally {
      setClaimBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto flex max-w-6xl items-center px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-steel">Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="relative mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
          <HomeBayAtmosphere />
          <div className="bay-rise relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <p className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-7xl">
              BradApp
            </p>
            <span className="bay-brand-line mt-5 block h-1 w-32 rounded-full sm:w-40" />
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-steel sm:text-xl">
              Search real cars, play for Brad Coins, and watch bay reviews with the people who ride
              with Brad.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/cars"
                className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Cars
              </Link>
              <Link
                to="/how-to"
                className="rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
              >
                How to
              </Link>
              <Link
                to="/signin"
                className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Sign in
              </Link>
            </div>
            <nav
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
              aria-label="Explore BradApp"
            >
              <Link to="/play" className={secondaryLinkClass}>
                Play
              </Link>
              <Link to="/reviews" className={secondaryLinkClass}>
                Reviews
              </Link>
            </nav>
          </div>

          <div className="relative z-10">
            <RecentlyViewedCars />
            <FeaturedReview />
            <LatestReviews />
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <HomeBayAtmosphere />
        <div className="bay-rise relative z-10">
          <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
          <p className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            BradApp
          </p>
          <span className="bay-brand-line mt-5 block h-1 w-28 rounded-full sm:w-36" />

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-mist sm:text-3xl">
                Welcome back, {user.displayName}
              </h1>
              <p className="mt-2 text-sm text-steel">
                {user.email} · {roleLabel(user.role)}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel">
                Browse the catalogue, manage your cars, play Top Trumps, and open bay reviews. New
                here?{" "}
                <Link to="/how-to" className="text-lime no-underline hover:underline">
                  Read the how-to
                </Link>
                .
              </p>
            </div>

            <div className="shrink-0 rounded-md border border-white/10 bg-bay-panel/60 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-steel">Wallet</p>
              <p className="mt-1 font-display text-2xl font-semibold text-lime">
                {formatCoins(user.coinBalance)}
              </p>
              {dailyLogin ? (
                <div className="mt-2 text-xs text-steel">
                  {dailyLogin.claimedToday ? (
                    <p className="text-lime">
                      Daily login claimed
                      {dailyLogin.claimedJustNow ? ` · +${dailyLogin.amount} BC` : ""}
                      <span className="block text-steel">
                        {dailyLogin.claimDate} · Europe/London
                      </span>
                    </p>
                  ) : (
                    <p>
                      +{dailyLogin.amount} BC available (London day) ·{" "}
                      <button
                        type="button"
                        disabled={claimBusy}
                        onClick={() => void onClaimDaily()}
                        className="border-0 bg-transparent p-0 font-inherit text-lime underline disabled:opacity-60"
                      >
                        {claimBusy ? "Claiming…" : "Claim"}
                      </button>
                    </p>
                  )}
                  {(dailyLogin.streak ?? 0) > 0 ? (
                    <p
                      className="mt-1 text-mist"
                      aria-label={`Login streak ${dailyLogin.streak}`}
                    >
                      Login streak ×{dailyLogin.streak}
                      {(dailyLogin.streakBonusAwarded ?? 0) > 0
                        ? ` · +${dailyLogin.streakBonusAwarded} BC`
                        : ""}
                    </p>
                  ) : null}
                  {claimNote ? <p className="mt-1 text-mist">{claimNote}</p> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/cars"
              className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Cars
            </Link>
            <Link
              to="/play"
              className="rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
            >
              Play
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              My cars
            </Link>
            <Link
              to="/reviews"
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Reviews
            </Link>
          </div>

          <nav
            className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5"
            aria-label="More in the bay"
          >
            <Link to="/how-to" className={secondaryLinkClass}>
              How to
            </Link>
            <Link to="/trades" className={secondaryLinkClass}>
              Trades
            </Link>
            <Link to="/favourites" className={secondaryLinkClass}>
              Favourites
            </Link>
            <Link to="/members" className={secondaryLinkClass}>
              Members
            </Link>
            <Link to="/leaderboard" className={secondaryLinkClass}>
              Leaderboard
            </Link>
            <Link to="/ledger" className={secondaryLinkClass}>
              Coin ledger
            </Link>
            <Link to="/account" className={secondaryLinkClass}>
              Account
            </Link>
            {isAdmin ? (
              <Link to="/admin" className={`${secondaryLinkClass} hover:text-rose`}>
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="border-0 bg-transparent p-0 font-display text-sm text-steel transition hover:text-rose"
            >
              Sign out
            </button>
          </nav>
        </div>

        <div className="relative z-10">
          <FirstVisitTips user={user} />
          <RecentlyViewedCars />
          <FeaturedReview />
          <LatestReviews />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
