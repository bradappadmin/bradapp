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
    id: "daily-login",
    title: "Daily login bonus",
    body: "Once per Europe/London calendar day, signing in (or your first signed-in home load) credits +25 Brad Coins. Keep claiming on consecutive London days for login streak bonuses: day 3 +15 BC, day 7 +50 BC (the toast mentions the streak; a missed day resets it). The home wallet and Account show Login streak ×N; the coin ledger lists Daily login and Login streak. Same day again? No second credit.",
    to: "/",
    cta: "Open Home",
  },
  {
    id: "buy-sell",
    title: "Buy and sell cars",
    body: "Browse a photo-first catalogue of real makes and models. Use Find, filters, and price sort — choices stay in the URL. Open studio shots and Brad Coin prices — never real money. On a listing, Compare queues that car into the compare tray (same picks as Cars and Favourites) and opens Compare — when two are ready you land side by side; Copy link puts the absolute URL on your clipboard with a toast. Save favourites, buy from Cars, then list or unlist from My cars (Find a car + Sort the bay there too).",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "find-sort",
    title: "Find, sort, and filter",
    body: "Most bays keep a Find box or chip filters in the URL so you can share the view. Cars: free-text + filters + price sort (Clear filters when nothing matches). My cars and Favourites: Find make/model plus Sort the bay. Members: name search and Has cars. Reviews: Find a review. Leaderboard: Find a member. Ledger: reason chips including Daily login, Login streak, and Gifts. Match history: Wins/Losses. Trades history: Completed/Declined.",
    to: "/cars",
    cta: "Try Cars search",
  },
  {
    id: "favourites",
    title: "Favourites: challenge and trade",
    body: "Save cars from a listing, then open Favourites. Find a favourite and Sort the bay, or pick two and compare. On someone else’s car, Offer trade and Challenge to Top Trumps deep-link into Trades and Play with that member and car ready. Your own cars and bay stock hide those CTAs. The nav Favourites badge shows how many you’ve saved.",
    to: "/favourites",
    cta: "Open Favourites",
  },
  {
    id: "play",
    title: "Play Top Trumps",
    body: "Put one of your cars up against the house or another member. Pick a category — higher BHP and top speed win; lower 0–60 wins. Challenge from a listing, Favourites, a public garage, Challenge to Top Trumps on the Members directory (not yourself), or Challenge to Top Trumps on the leaderboard standings and cup (not yourself), rematch on Play when you’re done, or Rematch from Match history. No car in the bay yet? Play shows an empty bay with Browse cars / My garage / Members. Playing earns Brad Coins. Win streaks pay extras: 3 wins +15 BC, 5 wins +40 BC (a loss resets the streak).",
    to: "/play",
    cta: "Open Play",
  },
  {
    id: "weekly-cup",
    title: "Weekly Top Trumps cup",
    body: "House and PvP wins count for the Europe/London week. This week’s cup standings sit on Play and beside the all-time podium on the leaderboard — Challenge to Top Trumps and Offer trade deep-link into Play and Trades with that member ready (hidden on your own row). When a new week starts, last week’s top scorer gets +50 Brad Coins once — lowest member id wins a tie.",
    to: "/leaderboard",
    cta: "Open cup standings",
  },
  {
    id: "trades",
    title: "Free card trades",
    body: "Swap cars without spending Brad Coins. Start from Trades, a member’s garage, Offer trade on someone else’s listing, Offer trade from Favourites, Offer trade on the Members directory (not yourself), or Offer trade on the leaderboard standings and cup (not yourself). An empty inbox points you to Members or Cars. The nav Trades badge counts pending offers waiting on you. Accept or decline — photo cards show what you’re swapping. History chips filter Completed / Declined; Trade again reopens compose when they still have that car.",
    to: "/trades",
    cta: "Open Trades",
  },
  {
    id: "reviews",
    title: "Reviews and drag races",
    body: "Watch bay reviews and head-to-head drag races Brad records in the app. Use Find a review to search by car make or model. On a review, Copy link puts the absolute URL on your clipboard with a toast — cue cards and playback stay. Pick the cars, film, publish — everyone else can watch what’s up. Studio thumbs keep the grid on-brand.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "profile",
    title: "Your bay profile",
    body: "Set a display name and short garage bio in Account. On My cars, pin one showcase car as the hero on your public garage. Copy garage link (Account, My cars, or any public garage) puts the absolute /members/:id URL on your clipboard with a toast. Friends see name, bio, and that pin on Members and the leaderboard — never your email or password.",
    to: "/account",
    cta: "Open Account",
  },
  {
    id: "gift-coins",
    title: "Gift Brad Coins",
    body: "Open another member’s public garage from Members — Copy garage link shares that bay. Use Gift coins: tap a Quick amount chip (10 / 25 / 50 BC) or type a custom amount, add an optional note, then Send gift. Your wallet is debited and theirs credited — play money only. The coin ledger shows Gift sent / Gift received; filter with the Gifts chip.",
    to: "/members",
    cta: "Open Members",
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
            A short tour of the midnight garage: invites, the daily login bonus and login streak
            bonuses, Brad Coins (tap the header balance for your ledger), photo-first cars with Find,
            listing Compare and Copy link, Favourites challenge and trade CTAs, Members directory
            Challenge and Offer trade, leaderboard Challenge and Offer trade, Copy garage link on
            member profiles, gift Quick amount chips, Top Trumps streaks and this week’s cup
            standings, free trades, member gifts, drag races, empty-bay next steps, and your bay
            showcase. Nothing here spends real money.
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
              — Wins/Losses chips; Rematch vs house or the same opponent.
            </li>
            <li>
              <Link to="/trades/history" className="text-lime no-underline hover:underline">
                Trades history
              </Link>{" "}
              — Completed/Declined chips; Trade again when they still have that car.
            </li>
            <li>
              <Link to="/members" className="text-lime no-underline hover:underline">
                Members
              </Link>{" "}
              — Find a member + Has cars; Challenge to Top Trumps or Offer trade on other directory
              cards (sign in; hidden on your own row); open a garage, Copy garage link, or gift Brad
              Coins.
            </li>
            <li>
              <Link to="/leaderboard" className="text-lime no-underline hover:underline">
                Leaderboard
              </Link>{" "}
              — Find a member, Brad Coin ranks, highlight cars, This week’s cup standings beside the
              podium, and Challenge to Top Trumps or Offer trade on other members’ standings and cup
              rows (sign in).
            </li>
            <li>
              <Link to="/garage" className="text-lime no-underline hover:underline">
                My cars
              </Link>{" "}
              — Find a car, Sort the bay, Compare garage cards into the same tray as Cars /
              Favourites, garage value, list prices, pin your showcase, and Copy garage link.
            </li>
            <li>
              <Link to="/favourites" className="text-lime no-underline hover:underline">
                Favourites
              </Link>{" "}
              — Find a favourite, Sort the bay, compare two, then Offer trade or Challenge to Top
              Trumps on someone else’s car (sign in). Nav badge = saved count.
            </li>
            <li>
              <Link to="/compare" className="text-lime no-underline hover:underline">
                Compare
              </Link>{" "}
              — start from a listing’s Compare CTA (tray picks, opens side by side when two are
              ready), Favourites / Cars, or Compare on My cars; empty bay sends you to Favourites or
              Browse cars.
            </li>
            <li>
              <Link to="/ledger" className="text-lime no-underline hover:underline">
                Coin ledger
              </Link>{" "}
              — every in/out for your Brad Coins (also open from the header balance chip), with
              reason chips including Daily login, Login streak, and Gifts (sign in).
            </li>
            <li>
              <Link to="/trades" className="text-lime no-underline hover:underline">
                Trades inbox
              </Link>{" "}
              — empty inbox points to Members / Browse cars for sale; nav badge = pending offers.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
