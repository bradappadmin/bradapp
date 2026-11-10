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
    body: "Sign up with email and a password. Invite codes are optional — use one if Brad or Napwood shared it (or open a Copy signup link that lands on /signup?invite=… with the code filled in), or join without. New members get starter Brad Coins. Admins can create invite codes from Admin when they want a private door — Copy code and Copy signup link are later admin steps.",
    to: "/signup",
    cta: "Open Sign up",
  },
  {
    id: "daily-login",
    title: "Daily login bonus",
    body: "Once per Europe/London calendar day, signing in (or your first signed-in home load) credits +25 Brad Coins. Keep claiming on consecutive London days for login streak bonuses: day 3 +15 BC, day 7 +50 BC (the toast mentions the streak; a missed day resets it). The home wallet and Account show Login streak ×N; the coin ledger lists Daily login and Login streak. Home’s login streak bay strip is the next step. Same day again? No second credit.",
    to: "/",
    cta: "Open Home",
  },
  {
    id: "home-streak-banner",
    title: "Home login streak bay strip",
    body: "On Home when you’re signed in, one Midnight Garage bay strip under the hero shows today’s daily bonus (+25 BC claimed or ready to claim) and login streak progress toward day 3 (+15 BC) and day 7 (+50 BC). Coin ledger and How to links sit on the strip; Claim appears when today’s +25 is still available. The wallet chip still echoes Login streak ×N — this strip is the clear progress view.",
    to: "/",
    cta: "Open Home",
  },
  {
    id: "home-recent-compare",
    title: "Compare from Recently viewed",
    body: "On Home, Recently viewed lists cars you opened on this device. Compare on a card queues into the shared tray with Cars / My cars (and Favourites) — same sticky Compare (1/2) tray; when two are ready, Side by side. Empty bay keeps Browse cars; Clear asks Confirm clear before wiping the device history (Keep cancels).",
    to: "/",
    cta: "Open Home",
  },
  {
    id: "buy-sell",
    title: "Buy and sell cars",
    body: "Browse a photo-first catalogue of real makes and models. Use Find, filters, and Sort the bay — choices stay in the URL. Open studio shots and Brad Coin prices — never real money. On a listing, Compare queues that car into the compare tray (same picks as Cars, Favourites, My cars, and home Recently viewed) and opens Compare — when two are ready you land side by side; Copy link puts the absolute URL on your clipboard with a toast. View reviews (when films exist for that make/model) is a later step. Save favourites, buy from Cars, then list or unlist from My cars (Find a car there too — Sort My cars and Quick price chips are later steps). Sort cars details follow Find, sort, and filter.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "find-sort",
    title: "Find, sort, and filter",
    body: "Most bays keep a Find box or chip filters in the URL so you can share the view. Cars: free-text + filters + Sort the bay (Sort cars details are the next step — Clear filters when nothing matches). My cars and Favourites: Find make/model plus Sort the bay (My cars Sort details are a later step). Members: name search and Has cars / Empty bay — plus Sort the bay on that directory (next step after Sort cars). Reviews: Find a review plus Sort the bay (Sort reviews details are a later step). Leaderboard: Find a member. Ledger: Find an entry plus type chips (All / Earn / Spend / Gift / Admin — Filter the coin ledger covers the details). Match history: Wins/Losses. Trades history: Completed/Declined.",
    to: "/cars",
    cta: "Try Cars search",
  },
  {
    id: "cars-sort",
    title: "Sort cars in the bay",
    body: "On Cars, Sort the bay orders the catalogue: Highest price, Lowest price, Name A–Z, or Name Z–A — same options as Favourites and My cars. The choice stays in the URL alongside Find and the make/body/price filters. Clear filters resets search, filters, and sort back to Lowest price. Compare on each card still feeds the shared tray; empty-bay and no-match CTAs stay.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "members-sort",
    title: "Sort Members in the bay",
    body: "On Members, Sort the bay orders the directory: Name A–Z, Name Z–A, Most cars, or Least cars. The choice stays in the URL alongside Find and Has cars / Empty bay. Clear filters resets search, garage chips, and sort back to Name A–Z. Challenge, Offer trade, and Gift Brad Coins stay on each row when you’re signed in.",
    to: "/members",
    cta: "Open Members",
  },
  {
    id: "favourites",
    title: "Favourites: challenge and trade",
    body: "Save cars from a listing, then open Favourites. Find a favourite and Sort the bay. On someone else’s car, Offer trade and Challenge to Top Trumps deep-link into Trades and Play with that member and car ready. Your own cars and bay stock hide those CTAs. The nav Favourites badge shows how many you’ve saved. Compare from Favourites (shared tray) is the next step; My cars uses the same Sort the bay options after that.",
    to: "/favourites",
    cta: "Open Favourites",
  },
  {
    id: "favourites-compare",
    title: "Compare from Favourites",
    body: "On Favourites, Compare on a saved card queues into the shared tray with Cars / My cars / Recently viewed — same sticky Compare (1/2) tray; when two are ready, Side by side. Offer trade and Challenge stay on someone else’s cars; Find, Sort the bay, and empty-bay CTAs stay.",
    to: "/favourites",
    cta: "Open Favourites",
  },
  {
    id: "garage-sort",
    title: "Sort My cars in the bay",
    body: "On My cars, Sort the bay orders Owned and For sale: Highest price, Lowest price, Name A–Z, or Name Z–A — same options as Favourites. The choice stays in the URL alongside Find a car. Clear filters resets search and sort back to Highest price. Compare on each card still feeds the shared tray; empty-bay and no-match CTAs stay. Quick price chips when you list or update a sale are the next step.",
    to: "/garage",
    cta: "Open My cars",
  },
  {
    id: "sell-price-chips",
    title: "Quick price when you list a car",
    body: "On My cars, when you list an owned car or update a for-sale asking price, tap a Quick price chip (50 / 100 / 250 / 500 BC) — same chip pattern as gift Quick amount — or type any Brad Coin price, then List for sale or Update price. Unlist, showcase, Compare, Find, and Sort the bay stay on the card.",
    to: "/garage",
    cta: "Open My cars",
  },
  {
    id: "play",
    title: "Play Top Trumps",
    body: "Put one of your cars up against the house or another member. Pick a category — higher BHP and top speed win; lower 0–60 wins. Challenge from a listing, Favourites, a public garage, Challenge to Top Trumps on the Members directory (not yourself), or Challenge to Top Trumps on the leaderboard standings and cup (not yourself), then rematch on Play when you’re done. Match history Rematch is the next step. No car in the bay yet? Play shows an empty bay with Browse cars / My garage / Members. Playing earns Brad Coins. Win streaks pay extras: 3 wins +15 BC, 5 wins +40 BC (a loss resets the streak).",
    to: "/play",
    cta: "Open Play",
  },
  {
    id: "play-rematch",
    title: "Rematch from Match history",
    body: "Open Match history after a bout. Wins/Losses chips stay in the URL. On a Challenge row, Rematch deep-links Play with that opponent ready (/play?opponent=…, plus theirCar when known). House rows offer Rematch vs house straight back to Play. Rematch hides when the opponent is missing or is you — Clear filter and Play still cover empty bays. Open car from Match history is the next step.",
    to: "/play/history",
    cta: "Open Match history",
  },
  {
    id: "play-history-open-car",
    title: "Open car from Match history",
    body: "On Match history rows, Open car takes you to the catalogue listing (/cars/:id) for your card when a listing id is known — and for theirs when known too (house cards often omit theirs). Rematch, Wins/Losses chips, and empty-bay CTAs stay. Open opponent from Match history is the next step.",
    to: "/play/history",
    cta: "Open Match history",
  },
  {
    id: "play-history-open-opponent",
    title: "Open opponent from Match history",
    body: "On Match history Challenge rows, Open opponent takes you to that member’s public garage (/members/:id). The CTA hides for house, when the opponent is missing, or when the opponent is you. Rematch, Open car, Wins/Losses chips, and empty-bay CTAs stay. Open profile on a selected Play opponent is the next step.",
    to: "/play/history",
    cta: "Open Match history",
  },
  {
    id: "play-open-opponent",
    title: "Open profile from Play",
    body: "On Play, when you Challenge a member and an opponent is selected (picker or Rematch deep-link /play?opponent=…), Open profile takes you to that member’s public garage (/members/:id). The CTA hides for Vs house and when the opponent is you. Win streak, Rematch, and Match history stay.",
    to: "/play",
    cta: "Open Play",
  },
  {
    id: "weekly-cup",
    title: "Weekly Top Trumps cup",
    body: "House and PvP wins count for the Europe/London week. This week’s cup standings sit on Play and beside the all-time podium on the leaderboard — an Ends in countdown ticks to London week end beside the +50 BC prize callout — Challenge to Top Trumps and Offer trade deep-link into Play and Trades with that member ready (hidden on your own row). When a new week starts, last week’s top scorer gets +50 Brad Coins once — lowest member id wins a tie. Your rank You highlight and Jump to my rank are the next step.",
    to: "/leaderboard",
    cta: "Open cup standings",
  },
  {
    id: "leaderboard-your-rank",
    title: "Find your rank on the leaderboard",
    body: "On the Brad Coin leaderboard when you’re signed in, your standings row (and cup / podium when you’re there) shows a You badge with a lime ring — Challenge and Offer trade stay hidden on yourself. A Your rank chip sits in the bay notes. When your standings row is off-screen or hidden by Find a member, Jump to my rank scrolls you back (and clears the filter if needed). Find, cup countdown, and empty / no-match CTAs stay.",
    to: "/leaderboard",
    cta: "Open Leaderboard",
  },
  {
    id: "trades",
    title: "Free card trades",
    body: "Swap cars without spending Brad Coins. Start from Trades, a member’s garage, Offer trade on someone else’s listing, Offer trade from Favourites, Offer trade on the Members directory (not yourself), or Offer trade on the leaderboard standings and cup (not yourself). An empty inbox points you to Members or Cars. The nav Trades badge counts pending offers waiting on you. Accept or decline — photo cards show what you’re swapping. History chips filter Completed / Declined. Offer again from Trade history is the next step.",
    to: "/trades",
    cta: "Open Trades",
  },
  {
    id: "trades-offer-again",
    title: "Offer again from Trade history",
    body: "Open Trade history after a deal resolves. Completed/Declined chips stay in the URL. On a row with another member, Offer again deep-links Trades compose with that person ready (/trades?with=…, plus theirCar when they still own that car). Offer again hides when the other party is missing or is you — Clear filter, Open trades, and Browse members still cover empty bays. Open car from Trades is the next step.",
    to: "/trades/history",
    cta: "Open Trade history",
  },
  {
    id: "trades-open-car",
    title: "Open car from Trades",
    body: "On Trades inbox (incoming or outgoing) and Trade history rows, Open car takes you to the catalogue listing (/cars/:id) for offered and wanted cars when listing ids are known — on history that’s you gave / you got. Offer again, Open partner, Accept / Decline / Cancel, Completed/Declined chips, and empty-bay CTAs stay. Open partner on inbox and history is the next step.",
    to: "/trades/history",
    cta: "Open Trade history",
  },
  {
    id: "trades-open-partner",
    title: "Open partner from Trades",
    body: "On Trades inbox (incoming or outgoing) and Trade history rows, Open partner takes you to the other party’s public garage (/members/:id). The CTA hides when the partner is missing or is you. Open car, Offer again, Accept / Decline / Cancel, Completed/Declined chips, and empty-bay CTAs stay.",
    to: "/trades",
    cta: "Open Trades",
  },
  {
    id: "reviews",
    title: "Reviews and drag races",
    body: "Watch bay reviews and head-to-head drag races Brad records in the app. Use Find a review to search by car make or model. On a review, Copy link puts the absolute URL on your clipboard with a toast — cue cards and playback stay. Pick the cars, film, publish — everyone else can watch what’s up. Studio thumbs keep the grid on-brand. Sort reviews is the next step; Open car to the catalogue follows after that.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "reviews-sort",
    title: "Sort reviews in the bay",
    body: "On Video reviews, Sort the bay orders the reel: Newest, Oldest, Title A–Z, or Title Z–A. The choice stays in the URL alongside Find a review and Cue card / Drag race type chips. Clear filters resets search, type, and sort back to Newest. Empty-bay and no-match CTAs stay; Open car to a related listing is the next step.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "reviews-open-car",
    title: "Open a car from a review",
    body: "On Video reviews, Open car on a film card (or on the review itself) takes you to the related catalogue listing (/cars/:id) when one exists for that bay car — same in-app pattern as Open listing elsewhere. Drag races can show one Open car per lane when both listings are known. Find a review, Sort the bay, type chips, empty-bay CTAs, and Copy link on a film stay. Compare from a review is the next step.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "reviews-compare",
    title: "Compare from a review",
    body: "On Video reviews (list or detail), Compare on a related car queues into the shared tray with Cars / Favourites / My cars / Recently viewed when a listing id is known — same sticky Compare (1/2) tray; when two are ready, Side by side. Drag races can show one Compare per lane. Open car, Copy link, Find, Sort, type chips, and empty-bay CTAs stay. View reviews from a listing is the next step.",
    to: "/reviews",
    cta: "Open Reviews",
  },
  {
    id: "listing-view-reviews",
    title: "View reviews from a listing",
    body: "On a catalogue listing (/cars/:id), View reviews deep-links into Video reviews Find for that make and model (/reviews?q=Make+Model) when matching films exist — the reverse of Open car from a review. The CTA hides when nothing in the reel matches. Compare, Copy link, and buy stay on the listing. View seller on a member-owned listing is the next step.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "listing-view-seller",
    title: "View seller from a listing",
    body: "On a catalogue listing (/cars/:id) with a member owner, View seller takes you to that seller’s public garage (/members/:id). The CTA hides for house / garage stock (no member id) and when you own the car. Compare, Copy link, View reviews, Challenge, Offer trade, and buy stay on the listing.",
    to: "/cars",
    cta: "Open Cars",
  },
  {
    id: "profile",
    title: "Your bay profile",
    body: "Set a display name and short garage bio in Account. On My cars, pin one showcase car as the hero on your public garage. Friends see name, bio, and that pin on Members and the leaderboard — never your email or password. Share the bay with Copy link on any public garage (next step).",
    to: "/account",
    cta: "Open Account",
  },
  {
    id: "copy-profile-link",
    title: "Copy link on member profiles",
    body: "Open any public garage (/members/:id) and tap Copy link — the absolute profile URL lands on your clipboard with a Link copied toast, same pattern as listing and review Copy link. Account and My cars still offer Copy garage link for that same /members/:id URL when you’re sharing your own bay from those screens.",
    to: "/members",
    cta: "Open Members",
  },
  {
    id: "gift-coins",
    title: "Gift Brad Coins",
    body: "From the Members directory, Gift Brad Coins on someone else’s card (not yourself) deep-links into that member’s public garage gift form (#gift-coins). Or open the garage yourself — Copy link on their profile shares that bay. Use Gift coins: tap a Quick amount chip (10 / 25 / 50 BC) or type a custom amount, add an optional note, then Send gift. Your wallet is debited and theirs credited — play money only. The coin ledger shows Gift sent / Gift received; filter with the Gift type chip (next step).",
    to: "/members",
    cta: "Open Members",
  },
  {
    id: "ledger-type",
    title: "Filter the coin ledger",
    body: "Open Coin ledger from the header balance or Account. Find an entry searches by reason or note. Type chips filter All / Earn / Spend / Gift / Admin — Earn and Spend follow the money in or out; Gift covers Gift sent / Gift received; Admin covers admin adjusts. Choices stay in the URL; Clear filters resets Find and type back to All.",
    to: "/ledger",
    cta: "Open Coin ledger",
  },
  {
    id: "admin",
    title: "Admin for Brad and Napwood",
    body: "Day-to-day admins correct accounts, freeze or unfreeze members, mint family invite codes, adjust Brad Coin balances, and edit cars, garages, and listings. Napwood can do everything Brad can — and can freeze Brad if needed. Brad cannot freeze Napwood. Quick amount chips on coin adjust come next; Sort the bay on inventory listings follows; Copy signup link on Family invites is after that; Open listing from inventory follows; Open member from Accounts follows; Open member from Coin adjustments is last in this admin walkthrough.",
    to: "/admin",
    cta: "Open Admin",
    adminOnly: true,
  },
  {
    id: "admin-coin-chips",
    title: "Quick amount on admin coin adjust",
    body: "On Coin adjustments and Accounts, Brad and Napwood correct a member’s Brad Coin balance with Quick amount chips (+25 / +50 / +100 / +250 BC) — same chip pattern as gift Quick amount — or type any signed Coin delta, add a note on Coin adjustments, then Adjust coins. Free-form still covers debit corrections. Open member on Accounts and Coin adjustments are later steps. Sort inventory listings is the next step.",
    to: "/admin/coin-history",
    cta: "Open Coin adjustments",
    adminOnly: true,
  },
  {
    id: "admin-inventory-sort",
    title: "Sort inventory listings in the bay",
    body: "On Cars & garages (Listings), Sort the bay orders the directory: Highest price, Lowest price, Name A–Z, or Name Z–A — same options as Cars / My cars / Favourites. The choice stays in the URL alongside Find a listing and status chips. Clear filters resets search, group, and sort back to Highest price. Paint and Save stay on each row; Open listing to the catalogue is a later step. Copy signup link on Family invites is the next step.",
    to: "/admin/inventory",
    cta: "Open Cars & garages",
    adminOnly: true,
  },
  {
    id: "admin-invite-signup-link",
    title: "Copy signup link for invites",
    body: "On Family invites, active codes offer Copy (bare code) and Copy signup link — the absolute /signup?invite=… URL with a toast. Opening that link prefills the invite field on Sign up. Used, expired, and revoked codes hide both copy actions. Require-invite, Find a code, and Revoke stay. Open listing from Cars & garages is the next step.",
    to: "/admin/invites",
    cta: "Open Family invites",
    adminOnly: true,
  },
  {
    id: "admin-open-listing",
    title: "Open a listing from inventory",
    body: "On Cars & garages (Listings), Open listing on a row takes you to the public catalogue page for that car (/cars/:id) — same in-app pattern as Open listing on a member garage. Find a listing, Sort the bay, Clear filters, Paint, and Save stay on the row. Open member from Accounts is the next step.",
    to: "/admin/inventory",
    cta: "Open Cars & garages",
    adminOnly: true,
  },
  {
    id: "admin-open-member",
    title: "Open a member from Accounts",
    body: "On Accounts, Open member on a row takes you to that member’s public garage (/members/:id) — same in-app pattern as Open listing from inventory. Find an account, Clear filters, type chips, Quick amount chips, Adjust coins, Save name, and Freeze stay on the row. Open member from Coin adjustments is the next step.",
    to: "/admin/users",
    cta: "Open Accounts",
    adminOnly: true,
  },
  {
    id: "admin-coin-history-open-member",
    title: "Open a member from Coin adjustments",
    body: "On Coin adjustments, Open member on an Adjust balance row (and on Recent adjustments) takes you to that member’s public garage (/members/:id) — same in-app pattern as Open member on Accounts. Find a member, Clear filters, balance chips, Quick amount chips, Adjust coins, and the note field stay on the row.",
    to: "/admin/coin-history",
    cta: "Open Coin adjustments",
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
            bonuses, home login streak bay strip (+25 today, day 3 / day 7 progress), Brad Coins
            (tap the header balance for your ledger), home Recently viewed Compare into the shared
            tray with Cars / My cars, Favourites Compare into that same tray, photo-first cars with
            Find, listing Compare and Copy link, listing View reviews (/reviews?q=Make+Model when
            films exist), listing View seller (/members/:id; hidden for self / house), Cars Sort the
            bay (Highest / Lowest price, Name A–Z / Z–A), Favourites
            challenge and trade CTAs, Members directory Sort the bay (Name A–Z /
            Z–A, Most / Least cars), Challenge, Offer trade, and Gift Brad Coins, Favourites and My
            cars Sort the bay (Highest / Lowest price, Name A–Z / Z–A), leaderboard Challenge and
            Offer trade, leaderboard You highlight and Jump to my rank, Copy link on member profiles
            (Copy garage link stays on Account / My cars), My cars Quick price chips (50 / 100 / 250 /
            500 BC) when listing or updating a sale, gift Quick amount chips, Coin ledger Find entry
            plus type chips (All / Earn / Spend / Gift / Admin), admin coin-adjust Quick amount chips
            (+25 / +50 / +100 / +250 BC) for Brad and Napwood, admin inventory Sort the bay (Highest /
            Lowest price, Name A–Z / Z–A), admin Family invites Copy signup link (/signup?invite=)
            beside Copy code, admin inventory Open listing (/cars/:id), admin Accounts Open member
            (/members/:id), admin Coin adjustments Open member (/members/:id), Top Trumps streaks,
            Match history Rematch (PvP opponent deep-link or house
            → Play), Match history Open car (/cars/:id when listing ids are known), Match history Open
            opponent (/members/:id on PvP; hidden for house / self / missing), Play Open profile
            (/members/:id when a PvP opponent is selected; hidden for house / self), this week’s cup
            standings with an Ends in countdown (Europe/London week end, +50 BC prize), free trades,
            Trade history Offer again (/trades?with=), Trades Open car (/cars/:id on inbox and history
            when listing ids are known), Trades Open partner (/members/:id on inbox and history;
            hidden for self), member gifts, drag races with Sort reviews (Newest / Oldest, Title A–Z /
            Z–A), Open car (/cars/:id) when a listing exists, and Reviews Compare into the shared tray
            when a listing is known, empty-bay next steps, and your bay showcase. Nothing here spends
            real money.
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
              <Link to="/" className="text-lime no-underline hover:underline">
                Home
              </Link>{" "}
              — login streak bay strip: today’s +25 BC status and progress toward day 3 (+15) / day 7
              (+50); Coin ledger and How to on the strip (sign in).
            </li>
            <li>
              <Link to="/play/history" className="text-lime no-underline hover:underline">
                Match history
              </Link>{" "}
              — Wins/Losses chips; Open car → /cars/:id when listing ids are known; Open opponent →
              /members/:id on PvP (hidden for house / self / missing); Rematch deep-links the same
              PvP opponent into Play, or Rematch vs house → Play (hidden for missing or self).
            </li>
            <li>
              <Link to="/play" className="text-lime no-underline hover:underline">
                Play
              </Link>{" "}
              — Challenge a member or land from Rematch (/play?opponent=); Open profile →
              /members/:id when an opponent is selected (hidden for house or self); win streak stays.
            </li>
            <li>
              <Link to="/trades/history" className="text-lime no-underline hover:underline">
                Trades history
              </Link>{" "}
              — Completed/Declined chips; Open car → /cars/:id when listing ids are known; Open
              partner → /members/:id; Offer again deep-links the other party into Trades
              (/trades?with=, plus theirCar when still owned; partner and Offer again hidden for
              missing or self).
            </li>
            <li>
              <Link to="/members" className="text-lime no-underline hover:underline">
                Members
              </Link>{" "}
              — Find a member, Has cars / Empty bay, Sort the bay; Challenge to Top Trumps, Offer
              trade, or Gift Brad Coins on other directory cards (sign in; hidden on your own row —
              Gift opens #gift-coins on their garage); open a garage or Copy link on their profile.
            </li>
            <li>
              <Link to="/leaderboard" className="text-lime no-underline hover:underline">
                Leaderboard
              </Link>{" "}
              — Find a member, Brad Coin ranks, highlight cars, This week’s cup standings beside the
              podium (Ends in countdown to Europe/London week end · +50 BC prize), You badge on your
              standings / cup / podium row with Jump to my rank when scrolled away, and Challenge to
              Top Trumps or Offer trade on other members’ standings and cup rows (sign in).
            </li>
            <li>
              <Link to="/cars" className="text-lime no-underline hover:underline">
                Cars
              </Link>{" "}
              — Find + filters; Sort the bay (Highest / Lowest price, Name A–Z / Z–A, same as
              Favourites / My cars); Compare into the tray; on a listing, View reviews →
              /reviews?q=Make+Model when films exist (hides when none); View seller → /members/:id
              when a member owns it (hidden for self or house); Clear filters when nothing matches.
            </li>
            <li>
              <Link to="/garage" className="text-lime no-underline hover:underline">
                My cars
              </Link>{" "}
              — Find a car; Sort the bay (Highest / Lowest price, Name A–Z / Z–A, same as
              Favourites); Quick price chips (50 / 100 / 250 / 500 BC) or free-form when listing /
              updating a sale; Compare garage cards into the same tray as Cars / Favourites; garage
              value, pin your showcase, and Copy garage link (same URL as profile Copy link).
            </li>
            <li>
              <Link to="/account" className="text-lime no-underline hover:underline">
                Account
              </Link>{" "}
              — display name, bio, and Copy garage link for your public /members/:id bay.
            </li>
            <li>
              <Link to="/favourites" className="text-lime no-underline hover:underline">
                Favourites
              </Link>{" "}
              — Find a favourite, Sort the bay, Compare into the shared tray with Cars / My cars,
              then Offer trade or Challenge to Top Trumps on someone else’s car (sign in). Nav badge
              = saved count.
            </li>
            <li>
              <Link to="/reviews" className="text-lime no-underline hover:underline">
                Reviews
              </Link>{" "}
              — Find a review; Cue card / Drag race chips; Sort the bay (Newest / Oldest, Title A–Z /
              Z–A); Open car → /cars/:id when a listing exists; Compare into the shared tray when a
              listing is known; Copy link on a film.
            </li>
            <li>
              <Link to="/compare" className="text-lime no-underline hover:underline">
                Compare
              </Link>{" "}
              — start from a listing’s Compare CTA (tray picks, opens side by side when two are
              ready), Compare on Favourites / Cars / My cars / Reviews, or Compare on home Recently
              viewed (shared tray); empty bay sends you to Favourites or Browse cars.
            </li>
            <li>
              <Link to="/admin/coin-history" className="text-lime no-underline hover:underline">
                Coin adjustments
              </Link>{" "}
              — Brad & Napwood: Find a member; balance chips; Clear filters; Open member →
              /members/:id on Adjust balance and Recent adjustments; Quick amount chips (+25 / +50 /
              +100 / +250 BC) or free-form Coin delta; Adjust coins.
            </li>
            <li>
              <Link to="/admin/users" className="text-lime no-underline hover:underline">
                Accounts
              </Link>{" "}
              — Brad & Napwood: Find an account; type chips; Clear filters; Open member →
              /members/:id; Quick amount chips; Adjust coins; Save name; Freeze.
            </li>
            <li>
              <Link to="/admin/inventory" className="text-lime no-underline hover:underline">
                Cars & garages
              </Link>{" "}
              — Brad & Napwood: Find a listing; Sort the bay (Highest / Lowest price, Name A–Z /
              Z–A, same as Cars / My cars); status chips; Clear filters; Open listing → /cars/:id;
              Paint and Save.
            </li>
            <li>
              <Link to="/admin/invites" className="text-lime no-underline hover:underline">
                Family invites
              </Link>{" "}
              — Brad & Napwood: Create codes; Copy the bare code or Copy signup link
              (/signup?invite=…, prefills Sign up); Require invite; Find a code; Revoke.
            </li>
            <li>
              <Link to="/ledger" className="text-lime no-underline hover:underline">
                Coin ledger
              </Link>{" "}
              — Find an entry; type chips All / Earn / Spend / Gift / Admin; also open from the
              header balance chip (sign in).
            </li>
            <li>
              <Link to="/trades" className="text-lime no-underline hover:underline">
                Trades inbox
              </Link>{" "}
              — Open car → /cars/:id for offered and wanted cars when listing ids are known; Open
              partner → /members/:id on incoming and outgoing offers (hidden for self); empty inbox
              points to Members / Browse cars for sale; nav badge = pending offers.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
