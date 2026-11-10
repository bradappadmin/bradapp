import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { HowToPage } from "./HowToPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
}));

import * as api from "../api";

describe("HowToPage Midnight Garage UI", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
  });

  it("shows bay hierarchy, find/sort filters, empty-bay CTAs, and walkthrough links", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HowToPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "How to" })).toBeInTheDocument();
    expect(screen.getByText(/Family walkthrough · Midnight garage/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Join the family bay" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily login bonus" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Buy and sell cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find, sort, and filter" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sort cars in the bay" })).toBeInTheDocument();
    expect(document.getElementById("cars-sort")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Sort Members in the bay" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Favourites: challenge and trade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sort My cars in the bay" })).toBeInTheDocument();
    expect(document.getElementById("garage-sort")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Play Top Trumps" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Rematch from Match history" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekly Top Trumps cup" })).toBeInTheDocument();
    expect(document.getElementById("play-rematch")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Free card trades" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Offer again from Trade history" }),
    ).toBeInTheDocument();
    expect(document.getElementById("trades-offer-again")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Reviews and drag races" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sort reviews in the bay" })).toBeInTheDocument();
    expect(document.getElementById("reviews-sort")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Your bay profile" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Copy link on member profiles" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gift Brad Coins" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admin for Brad and Napwood" }),
    ).toBeInTheDocument();
    expect(document.getElementById("members-sort")).not.toBeNull();
    expect(document.getElementById("copy-profile-link")).not.toBeNull();

    expect(screen.getByText(/invite codes are optional/i)).toBeInTheDocument();
    expect(screen.getAllByText(/daily login bonus/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\+25 Brad Coins/i)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London calendar day/i)).toBeInTheDocument();
    expect(screen.getByText(/day 3 \+15 BC, day 7 \+50 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/missed day resets/i)).toBeInTheDocument();
    expect(screen.getByText(/Login streak ×N/i)).toBeInTheDocument();
    expect(screen.getByText(/home wallet and Account/i)).toBeInTheDocument();
    expect(screen.getAllByText(/login streak bonuses/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No second credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Find, filters, and Sort the bay/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sort cars details follow Find, sort, and filter/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Compare queues that car into the compare tray/i)).toBeInTheDocument();
    expect(screen.getByText(/when two are ready you land side by side/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Copy link puts the absolute URL/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/cue cards and playback stay/i)).toBeInTheDocument();
    expect(screen.getByText(/listing Compare and Copy link/i)).toBeInTheDocument();
    expect(screen.getByText(/header balance for your ledger/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Cars Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Members directory Sort the bay \(Name A–Z \/ Z–A, Most \/ Least cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Favourites and My cars Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Cars, Sort the bay orders the catalogue: Highest price, Lowest price, Name A–Z, or Name Z–A/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/same options as Favourites and My cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Clear filters resets search, filters, and sort back to Lowest price/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cars: free-text \+ filters \+ Sort the bay \(Sort cars details are the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Offer trade and Challenge to Top Trumps/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Members, Sort the bay orders the directory: Name A–Z, Name Z–A, Most cars, or Least cars/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clear filters resets search, garage chips, and sort back to Name A–Z/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On My cars, Sort the bay orders Owned and For sale: Highest price, Lowest price, Name A–Z, or Name Z–A/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/same options as Favourites/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/Clear filters resets search and sort back to Highest price/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/My cars uses the same Sort the bay options — next step/i)).toBeInTheDocument();
    expect(screen.getByText(/nav Favourites badge shows how many/i)).toBeInTheDocument();
    expect(screen.getByText(/nav Trades badge counts pending offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Match history: Wins\/Losses/i)).toBeInTheDocument();
    expect(screen.getByText(/Match history Rematch is the next step/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /On a Challenge row, Rematch deep-links Play with that opponent ready \(\/play\?opponent=/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/House rows offer Rematch vs house straight back to Play/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Rematch hides when the opponent is missing or is you/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Match history Rematch \(PvP opponent deep-link or house → Play\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Trades history: Completed\/Declined/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Offer again from Trade history is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Offer again deep-links Trades compose with that person ready \(\/trades\?with=/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Offer again hides when the other party is missing or is you/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trade history Offer again \(\/trades\?with=\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/empty bay with Browse cars \/ My garage \/ Members/i)).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points you to Members or Cars/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Find a review/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sort reviews is the next step/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Video reviews, Sort the bay orders the reel: Newest, Oldest, Title A–Z, or Title Z–A/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clear filters resets search, type, and sort back to Newest/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /drag races with Sort reviews \(Newest \/ Oldest, Title A–Z \/ Z–A\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reviews: Find a review plus Sort the bay/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 wins \+15 BC, 5 wins \+40 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London week/i)).toBeInTheDocument();
    expect(screen.getByText(/This week.?s cup standings sit on Play/i)).toBeInTheDocument();
    expect(screen.getByText(/beside the all-time podium on the leaderboard/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Challenge to Top Trumps and Offer trade deep-link into Play and Trades with that member ready/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Challenge to Top Trumps on the Members directory/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Challenge to Top Trumps on the leaderboard standings and cup/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Offer trade on the Members directory/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Offer trade on the leaderboard standings and cup/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/leaderboard Challenge and Offer trade/i)).toBeInTheDocument();
    expect(screen.getByText(/gift Quick amount chips/i)).toBeInTheDocument();
    expect(screen.getByText(/pin one showcase car/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Share the bay with Copy link on any public garage/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open any public garage \(\/members\/:id\) and tap Copy link — the absolute profile URL/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Account and My cars still offer Copy garage link for that same/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Copy garage link stays on Account \/ My cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gift Brad Coins on someone else.?s card \(not yourself\) deep-links/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/#gift-coins/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Copy link on their profile shares that bay/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Quick amount chip \(10 \/ 25 \/ 50 BC\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Gift sent \/ Gift received/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Gifts/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/member gifts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Daily login/i).length).toBeGreaterThan(0);

    expect(screen.getByRole("link", { name: "Match history" })).toHaveAttribute(
      "href",
      "/play/history",
    );
    expect(screen.getByRole("link", { name: "Trades history" })).toHaveAttribute(
      "href",
      "/trades/history",
    );
    expect(screen.getAllByText(/Wins\/Losses chips/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(
        /Rematch deep-links the same PvP opponent into Play, or Rematch vs house → Play/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Completed\/Declined chips/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(
        /Offer again deep-links the other party into Trades \(\/trades\?with=/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/start from a listing.?s Compare CTA \(tray picks/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/or Compare on My cars/i)).toBeInTheDocument();
    expect(screen.getByText(/empty bay sends you to Favourites or Browse cars/i)).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points to Members \/ Browse cars for sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer trade or Challenge to Top Trumps/i)).toBeInTheDocument();
    expect(screen.getByText(/header balance chip/i)).toBeInTheDocument();
    expect(screen.getByText(/nav badge = pending offers/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find a car; Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A, same as Favourites\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/reason chips/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Login streak/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/This week.?s cup standings beside the podium/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Challenge to Top Trumps or Offer trade on other members.? standings and cup/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find a member, Has cars \/ Empty bay, Sort the bay; Challenge to Top Trumps/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Members: name search and Has cars \/ Empty bay — plus Sort the bay on that directory/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Gift opens #gift-coins on their garage/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Compare garage cards into the same tray as Cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pin your showcase, and Copy garage link \(same URL as profile Copy link\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/display name, bio, and Copy garage link for your public/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Open Home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Open Cars" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Open Cars" })[0]).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Try Cars search" })).toHaveAttribute("href", "/cars");
    expect(
      screen.getByText(
        /Find \+ filters; Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A, same as Favourites \/ My cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Cars" }).some((el) => el.getAttribute("href") === "/cars"),
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Open Favourites" })).toHaveAttribute(
      "href",
      "/favourites",
    );
    expect(screen.getByRole("link", { name: "Open My cars" })).toHaveAttribute("href", "/garage");
    expect(screen.getByRole("link", { name: "Open Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Open Match history" })).toHaveAttribute(
      "href",
      "/play/history",
    );
    expect(screen.getByRole("link", { name: "Open cup standings" })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(screen.getByRole("link", { name: "Open Trades" })).toHaveAttribute("href", "/trades");
    expect(screen.getByRole("link", { name: "Open Trade history" })).toHaveAttribute(
      "href",
      "/trades/history",
    );
    expect(screen.getAllByRole("link", { name: "Open Reviews" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Open Reviews" })[0]).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(
      screen.getByText(
        /Find a review; Cue card \/ Drag race chips; Sort the bay \(Newest \/ Oldest, Title A–Z \/ Z–A\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Account" })).toHaveAttribute("href", "/account");
    expect(screen.getAllByRole("link", { name: "Open Members" }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/gift Brad Coins/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Open Admin" })).not.toBeInTheDocument();
  });
});
