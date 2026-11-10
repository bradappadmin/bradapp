import { Link } from "react-router-dom";
import { useAuth } from "../auth-context";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
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
    id: "join",
    title: "Join the family bay",
    body: "Sign up with email and a password. Invite codes are optional — use one if Brad or Napwood shared it, or join without. New members get starter Brad Coins. Admins can create invite codes from Admin when they want a private door.",
    to: "/signup",
    cta: "Open Sign up",
  },
  {
    id: "buy-sell",
    title: "Buy and sell cars",
    body: "Browse a photo-first catalogue of real makes and models. Filter, compare, and open a listing for studio shots and Brad Coin prices — never real money. Save favourites, buy from Cars, then list or unlist from My cars.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "play",
    title: "Play Top Trumps",
    body: "Put one of your cars up against the house or another member. Pick a category — higher BHP and top speed win; lower 0–60 wins. Challenge from a listing or public garage, rematch on Play when you’re done, or Rematch from Match history. Playing earns Brad Coins. Win streaks pay extras: 3 wins +15 BC, 5 wins +40 BC (a loss resets the streak).",
    to: "/play",
    cta: "Open Play",
  },
  {
    id: "weekly-cup",
    title: "Weekly Top Trumps cup",
    body: "House and PvP wins count for the Europe/London week. Standings sit on Play and the leaderboard. When a new week starts, last week’s top scorer gets +50 Brad Coins once — lowest member id wins a tie.",
    to: "/play",
    cta: "Open Play cup",
  },
  {
    id: "trades",
    title: "Free card trades",
    body: "Swap cars without spending Brad Coins. Start from Trades, a member’s garage, or Offer trade on someone else’s listing. Accept or decline in your inbox — photo cards show what you’re swapping. Completed history lists who you traded with; Trade again reopens compose when they still have that car.",
    to: "/trades",
    cta: "Open Trades",
  },
  {
    id: "reviews",
    title: "Reviews and drag races",
    body: "Watch bay reviews and head-to-head drag races Brad records in the app. Pick the cars, film, publish — everyone else can watch what’s up. Studio thumbs keep the grid on-brand.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "profile",
    title: "Your bay profile",
    body: "Set a display name and short garage bio in Account. On My cars, pin one showcase car as the hero on your public garage. Friends see name, bio, and that pin on Members and the leaderboard — never your email or password.",
    to: "/account",
    cta: "Open Account",
  },
  {
    id: "admin",
    title: "Admin for Brad and Napwood",
    body: "Day-to-day admins correct accounts, freeze or unfreeze members, mint family invite codes, adjust Brad Coin balances, and edit cars, garages, and listings. Napwood can do everything Brad can — and can freeze Brad if needed. Brad cannot freeze Napwood.",
    to: "/admin",
    cta: "Open Admin",
    adminOnly: true,
  },
];

export function HowToPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise">
          <p className="text-xs uppercase tracking-[0.28em] text-steel">
            Family walkthrough · Midnight garage
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            How to
          </h1>
          <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel sm:text-base">
            A short tour of the midnight garage: invites, Brad Coins, photo-first cars, Top Trumps
            streaks and the weekly cup, free trades, drag races, and your bay showcase. Nothing here
            spends real money.
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
        </header>

        <ol className="bay-rise-delay mt-8 list-none space-y-3 p-0">
          {STEPS.map((step, index) => {
            const lockedAdmin = Boolean(step.adminOnly && !isAdmin);
            return (
              <li
                key={step.id}
                id={step.id}
                className="play-panel rounded-md border p-4 sm:p-5"
              >
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
                    className="mt-5 inline-block rounded-md border border-lime/40 px-4 py-2 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                  >
                    {step.cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <section
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
          aria-labelledby="howto-also-handy"
        >
          <h2 id="howto-also-handy" className="font-display text-xl text-mist">
            Also handy
          </h2>
          <ul className="mt-4 list-none space-y-3 border-t border-white/10 p-0 pt-4 text-sm text-steel">
            <li>
              <Link to="/play/history" className="text-lime no-underline hover:underline">
                Match history
              </Link>{" "}
              — past Top Trumps; Rematch vs house or the same opponent.
            </li>
            <li>
              <Link to="/trades/history" className="text-lime no-underline hover:underline">
                Completed trades
              </Link>{" "}
              — accepted swaps; Trade again when they still have that car.
            </li>
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
              — Brad Coin ranks, highlight cars, and this week’s Top Trumps cup (sign in).
            </li>
            <li>
              <Link to="/garage" className="text-lime no-underline hover:underline">
                My cars
              </Link>{" "}
              — garage value, list prices, unlist, and pin your showcase car.
            </li>
            <li>
              <Link to="/favourites" className="text-lime no-underline hover:underline">
                Favourites
              </Link>{" "}
              — listings you saved; select two and compare side by side (sign in).
            </li>
            <li>
              <Link to="/compare" className="text-lime no-underline hover:underline">
                Compare
              </Link>{" "}
              — photo + specs face-off for two cars from Cars or Favourites.
            </li>
            <li>
              <Link to="/ledger" className="text-lime no-underline hover:underline">
                Coin ledger
              </Link>{" "}
              — every in/out for your Brad Coins (sign in).
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
