import { Link } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { SiteHeader } from "../components/SiteHeader";
import { roleLabel } from "../types";

export function HomePage() {
  const { user, loading, setUser } = useAuth();

  async function onSignOut() {
    await api.signOut();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto flex max-w-3xl items-center px-6 py-16">
          <p className="text-steel">Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="relative mx-auto flex max-w-3xl flex-col px-6 py-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.2),transparent_70%)]" />
          <div className="bay-rise relative">
            <p className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
              BradApp
            </p>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full" />
            <p className="mt-8 max-w-xl text-lg text-steel">
              A midnight garage for Brad and the people who ride with him. Search real cars, play for
              Brad Coins, and watch bay reviews.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/cars"
                className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Cars
              </Link>
              <Link
                to="/play"
                className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Play
              </Link>
              <Link
                to="/reviews"
                className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Reviews
              </Link>
              <Link
                to="/signin"
                className="rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative mx-auto flex max-w-3xl flex-col px-6 py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.14),transparent_70%)]" />
        <div className="bay-rise relative">
          <p className="font-display text-5xl font-bold tracking-tight text-white">BradApp</p>
          <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full" />
          <h1 className="mt-8 font-display text-3xl font-semibold text-mist">
            Welcome back, {user.displayName}
          </h1>
          <p className="mt-3 text-steel">
            {user.email} · {roleLabel(user.role)}
          </p>
          <p className="mt-4 font-display text-2xl font-semibold text-lime">
            {formatCoins(user.coinBalance)}
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-steel">
            Browse the catalogue, manage your cars, play Top Trumps, and open bay reviews.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/cars"
              className="bay-cta rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
            >
              Cars
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
            >
              My cars
            </Link>
            <Link
              to="/play"
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Play
            </Link>
            <Link
              to="/members"
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Members
            </Link>
            <Link
              to="/reviews"
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
            >
              Reviews
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-rose hover:text-rose"
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist transition hover:border-rose hover:text-rose"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
