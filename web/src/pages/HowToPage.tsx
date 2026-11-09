import { Link } from "react-router-dom";
import { useAuth } from "../auth-context";
import { SiteHeader } from "../components/SiteHeader";

type Step = {
  id: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  adminOnly?: boolean;
};

const STEPS: Step[] = [
  {
    id: "buy-sell",
    title: "Buy and sell cars",
    body: "Search the catalogue for real makes and models. Prices are in Brad Coins — never real money. Buy from Cars, then list or unlist from My cars.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "play",
    title: "Play Top Trumps",
    body: "Put one of your cars up against the house or another member. Pick a category — higher BHP and top speed win; lower 0–60 wins. Playing earns Brad Coins. Rematch with a new card pick when you’re done.",
    to: "/play",
    cta: "Open Play",
  },
  {
    id: "trades",
    title: "Free card trades",
    body: "Swap cars with family without spending Brad Coins. Offer a trade from Trades or a member’s garage, then accept or decline in your inbox.",
    to: "/trades",
    cta: "Open Trades",
  },
  {
    id: "reviews",
    title: "Bay reviews",
    body: "Watch reviews recorded in the app. Brad (and Napwood) can record and publish; everyone else can watch what’s up in the bay.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "admin",
    title: "Admin for Brad and Napwood",
    body: "Day-to-day admins correct accounts, freeze or unfreeze members, adjust Brad Coin balances, and edit cars, garages, and listings. Napwood can do everything Brad can — and can freeze Brad if needed. Brad cannot freeze Napwood.",
    to: "/admin",
    cta: "Open Admin",
    adminOnly: true,
  },
];

export function HowToPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.16),transparent_70%)]" />

        <div className="bay-rise relative">
          <p className="text-xs uppercase tracking-wide text-steel">Family walkthrough</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">How to</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-steel">
            A short tour of the midnight garage: Brad Coins, cars, play, free trades, reviews, and
            admin for Brad and Napwood. Nothing here spends real money.
          </p>
          {!user ? (
            <p className="mt-4 text-sm text-steel">
              <Link to="/signup" className="text-lime no-underline hover:underline">
                Sign up
              </Link>{" "}
              to get starter Brad Coins, or{" "}
              <Link to="/signin" className="text-lime no-underline hover:underline">
                sign in
              </Link>{" "}
              if you’re already in the bay.
            </p>
          ) : null}
        </div>

        <ol className="bay-rise-delay mt-10 list-none space-y-0 border-t border-white/10 p-0">
          {STEPS.map((step, index) => {
            const lockedAdmin = Boolean(step.adminOnly && !isAdmin);
            return (
              <li key={step.id} id={step.id} className="border-b border-white/10 py-8">
                <p className="font-display text-xs uppercase tracking-wide text-steel">
                  Step {index + 1}
                  {step.adminOnly ? " · Brad & Napwood" : null}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-mist">{step.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-steel">{step.body}</p>
                {lockedAdmin ? (
                  <p className="mt-4 text-sm text-steel">
                    Admin is only for Brad and Napwood. Members use Cars, Play, Trades, and Reviews.
                  </p>
                ) : (
                  <Link
                    to={step.to}
                    className="mt-5 inline-block rounded-md border border-lime/40 px-4 py-2 font-display text-sm font-semibold text-lime no-underline hover:bg-lime/10"
                  >
                    {step.cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <section className="mt-10">
          <h2 className="font-display text-xl text-mist">Also handy</h2>
          <ul className="mt-4 list-none space-y-3 border-t border-white/10 p-0 pt-4 text-sm text-steel">
            <li>
              <Link to="/members" className="text-lime no-underline hover:underline">
                Members
              </Link>{" "}
              — open a public garage, then challenge or offer a free trade.
            </li>
            <li>
              <Link to="/leaderboard" className="text-lime no-underline hover:underline">
                Leaderboard
              </Link>{" "}
              — who’s richest in Brad Coins (sign in).
            </li>
            <li>
              <Link to="/garage" className="text-lime no-underline hover:underline">
                My cars
              </Link>{" "}
              — garage value, list prices, and unlist.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
