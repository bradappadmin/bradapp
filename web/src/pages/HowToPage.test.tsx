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
    expect(screen.getByRole("heading", { name: "Top Trumps peek on Cars" })).toBeInTheDocument();
    expect(document.getElementById("cars-catalogue-trump-stats")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Studio card hover motion" })).toBeInTheDocument();
    expect(document.getElementById("car-card-hover-motion")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Sort Members in the bay" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Favourites: challenge and trade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sort My cars in the bay" })).toBeInTheDocument();
    expect(document.getElementById("garage-sort")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Quick price when you list a car" }),
    ).toBeInTheDocument();
    expect(document.getElementById("sell-price-chips")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Paint colour when you list a car" }),
    ).toBeInTheDocument();
    expect(document.getElementById("garage-sell-paint")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "My cars bay value strip" })).toBeInTheDocument();
    expect(document.getElementById("garage-bay-value")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on My cars" }),
    ).toBeInTheDocument();
    expect(document.getElementById("garage-trump-stats")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Play Top Trumps" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Play TrumpCard studio motion" }),
    ).toBeInTheDocument();
    expect(document.getElementById("play-trumpcard-motion")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Rematch from Match history" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open profile from Play" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekly Top Trumps cup" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Find your rank on the leaderboard" }),
    ).toBeInTheDocument();
    expect(document.getElementById("leaderboard-your-rank")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on leaderboard cars" }),
    ).toBeInTheDocument();
    expect(document.getElementById("leaderboard-trump-stats")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open car from leaderboard highlights" }),
    ).toBeInTheDocument();
    expect(document.getElementById("leaderboard-open-car")).not.toBeNull();
    expect(document.getElementById("play-rematch")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open car from Match history" }),
    ).toBeInTheDocument();
    expect(document.getElementById("play-history-open-car")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open opponent from Match history" }),
    ).toBeInTheDocument();
    expect(document.getElementById("play-history-open-opponent")).not.toBeNull();
    expect(document.getElementById("play-open-opponent")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Free card trades" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Offer again from Trade history" }),
    ).toBeInTheDocument();
    expect(document.getElementById("trades-offer-again")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Open car from Trades" })).toBeInTheDocument();
    expect(document.getElementById("trades-open-car")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Open partner from Trades" })).toBeInTheDocument();
    expect(document.getElementById("trades-open-partner")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Reviews and drag races" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sort reviews in the bay" })).toBeInTheDocument();
    expect(document.getElementById("reviews-sort")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Open a car from a review" })).toBeInTheDocument();
    expect(document.getElementById("reviews-open-car")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Compare from a review" })).toBeInTheDocument();
    expect(document.getElementById("reviews-compare")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "View reviews from a listing" }),
    ).toBeInTheDocument();
    expect(document.getElementById("listing-view-reviews")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "View seller from a listing" }),
    ).toBeInTheDocument();
    expect(document.getElementById("listing-view-seller")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Top Trumps bay strip on a listing" }),
    ).toBeInTheDocument();
    expect(document.getElementById("listing-trump-stats")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Listing studio hero motion" }),
    ).toBeInTheDocument();
    expect(document.getElementById("listing-hero-motion")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Your bay profile" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Copy link on member profiles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on a public garage" }),
    ).toBeInTheDocument();
    expect(document.getElementById("member-garage-trump-stats")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Public garage bay value strip" }),
    ).toBeInTheDocument();
    expect(document.getElementById("member-garage-bay-value")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Gift Brad Coins" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter the coin ledger" })).toBeInTheDocument();
    expect(document.getElementById("ledger-type")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Admin for Brad and Napwood" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Quick amount on admin coin adjust" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-coin-chips")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Sort inventory listings in the bay" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-inventory-sort")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Copy signup link for invites" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-invite-signup-link")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open a listing from inventory" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-open-listing")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open a member from Accounts" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-open-member")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open a member from Coin adjustments" }),
    ).toBeInTheDocument();
    expect(document.getElementById("admin-coin-history-open-member")).not.toBeNull();
    expect(document.getElementById("members-sort")).not.toBeNull();
    expect(document.getElementById("copy-profile-link")).not.toBeNull();

    expect(screen.getByText(/invite codes are optional/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/signup\?invite=/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/active codes offer Copy \(bare code\) and Copy signup link/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/admin Family invites Copy signup link \(\/signup\?invite=\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/admin inventory Open listing \(\/cars\/:id\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/admin Accounts Open member \(\/members\/:id\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/admin Coin adjustments Open member \(\/members\/:id\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open listing on a row takes you to the public catalogue page for that car \(\/cars\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Accounts, Open member on a row takes you to that member.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Coin adjustments, Open member on an Adjust balance row \(and on Recent adjustments\) takes you to that member.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open listing from Cars & garages is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open member from Accounts is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open member from Coin adjustments is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Brad & Napwood: Create codes; Copy the bare code or Copy signup link/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open listing → \/cars\/:id; Paint and Save/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open member → \/members\/:id; Quick amount chips; Adjust coins/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open member → \/members\/:id on Adjust balance and Recent adjustments/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/daily login bonus/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\+25 Brad Coins/i)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London calendar day/i)).toBeInTheDocument();
    expect(screen.getByText(/day 3 \+15 BC, day 7 \+50 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/missed day resets/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Login streak ×N/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/home wallet and Account/i)).toBeInTheDocument();
    expect(screen.getAllByText(/login streak bonuses/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Home.?s login streak bay strip is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Home login streak bay strip" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /today.?s daily bonus \(\+25 BC claimed or ready to claim\) and login streak progress toward day 3 \(\+15 BC\) and day 7 \(\+50 BC\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/home login streak bay strip \(\+25 today, day 3 \/ day 7 progress\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/No second credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Find, filters, and Sort the bay/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sort cars details follow Find, sort, and filter/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Compare queues that car into the compare tray/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /same picks as Cars, Favourites, My cars, and home Recently viewed/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/when two are ready you land side by side/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Copy link puts the absolute URL/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/cue cards and playback stay/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /listing Compare and Copy link, listing View reviews \(\/reviews\?q=Make\+Model when films exist\), listing View seller \(\/members\/:id; hidden for self \/ house\), listing Top Trumps bay strip under the studio hero \(Power \/ 0–60 \/ Top speed\), listing studio hero motion \(entrance fade\/rise, photo ease, reduced-motion\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /View reviews \(when films exist for that make\/model\) is a later step/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /home Recently viewed Top Trumps peek \(same Power \/ 0–60 \/ Top speed\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/home Recently viewed Compare into the shared tray with Cars \/ My cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps peek on Recently viewed is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on Recently viewed" }),
    ).toBeInTheDocument();
    expect(document.getElementById("home-recent-trump-stats")).not.toBeNull();
    expect(
      screen.getByText(
        /Recently viewed media cards show a compact Top Trumps peek under the studio photo: Power, 0–60, and Top speed/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare from Recently viewed is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compare from Recently viewed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Open car from Family activity" }),
    ).toBeInTheDocument();
    expect(document.getElementById("home-activity-open-car")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open car from Latest reviews" }),
    ).toBeInTheDocument();
    expect(document.getElementById("home-reviews-open-car")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Open member from Family activity" }),
    ).toBeInTheDocument();
    expect(document.getElementById("home-activity-open-member")).not.toBeNull();
    expect(
      screen.getByText(
        /Compare on a card queues into the shared tray with Cars \/ My cars \(and Favourites\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The Top Trumps peek stays on each card/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Empty bay keeps Browse cars/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Clear asks Confirm clear before wiping the device history/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open car from Family activity is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car on a row takes you to the catalogue listing \(\/cars\/:id\) when that event already knows a listing id/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The CTA hides for gifts and any row without a listing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open member from Family activity is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Family activity rows that know an actor member show Open member to that person.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The CTA hides when the actor is missing, is you, or would be house \(no member id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open car from Latest reviews is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Latest reviews \(and Featured when pinned\) show Open car → \/cars\/:id when a related listing is known — drag races can show one Open car per lane/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Watch \/ Watch featured still open the film; studio thumbs stay/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The CTA hides when no listing is known/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Family activity Open car \(\/cars\/:id when a listing is known; hidden for gifts \/ missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /home Latest \/ Featured reviews Open car \(\/cars\/:id when a listing is known; hidden when missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Family activity Open member \(\/members\/:id when an actor is known; hidden for self \/ missing \/ house\)/i,
      ),
    ).toBeInTheDocument();
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
      screen.getByText(/Catalogue Top Trumps peek is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Top Trumps peek on Cars" })).toBeInTheDocument();
    expect(
      screen.getByText(/the same stats Play uses/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Studio card hover motion is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Studio card hover motion" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /hover soft-lifts the bay shell, eases the studio photo a little larger, and adds a lime\/rose edge accent/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Prefers-reduced-motion keeps the card still \(no lift \/ no photo zoom\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Cars Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /studio card hover motion \(bay lift, photo ease, reduced-motion\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /compact Top Trumps peek under the studio photo: Power, 0–60, and Top speed/i,
      ).length,
    ).toBeGreaterThanOrEqual(2);
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
    expect(
      screen.getByText(
        /Quick price chips when you list or update a sale are the next step/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /tap a Quick price chip \(50 \/ 100 \/ 250 \/ 500 BC\) — same chip pattern as gift Quick amount/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Paint colour when you list is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Paint colour when you list a car" }),
    ).toBeInTheDocument();
    expect(document.getElementById("garage-sell-paint")).not.toBeNull();
    expect(
      screen.getByText(
        /pick Paint from the same curated studio colours as admin — a live studio thumb \(and the card photo\) update as you change it/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/My cars bay value strip is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /one Midnight Garage bay strip under the hero shows owned car count and total Brad Coin value/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sold history stays out of the total/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps peek on My cars is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /owned and for-sale photo-first media cards show a compact Top Trumps peek under the studio photo: Power, 0–60, and Top speed — the same strip as Cars and Favourites/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /My cars Quick price chips \(50 \/ 100 \/ 250 \/ 500 BC\) when listing or updating a sale/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /My cars Paint colour \(same curated studio paints as admin, live thumb\) when listing or updating a sale/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /My cars bay value strip \(owned count \+ total BC; sold history excluded\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /My cars Top Trumps peek \(same Power \/ 0–60 \/ Top speed on owned and for-sale cards\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sort My cars and Quick price chips are later steps/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/nav Favourites badge shows how many/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps peek on Favourites is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on Favourites" }),
    ).toBeInTheDocument();
    expect(document.getElementById("favourites-trump-stats")).not.toBeNull();
    expect(
      screen.getByText(/same strip as Cars\. Offer trade, Challenge, Compare/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Favourites bay value strip is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Favourites bay value strip" }),
    ).toBeInTheDocument();
    expect(document.getElementById("favourites-bay-value")).not.toBeNull();
    expect(
      screen.getByText(
        /one Midnight Garage bay strip under the hero shows favourite count and total Brad Coin value — list prices on cars you.?ve saved\. The strip hides on an empty bay/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/My cars uses the same Sort the bay options after that/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compare from Favourites" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare on a saved card queues into the shared tray with Cars \/ My cars \/ Recently viewed/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Offer trade, Challenge, and the Top Trumps peek stay on the card/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare from Favourites is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps winners on Compare is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top Trumps winners on Compare" }),
    ).toBeInTheDocument();
    expect(document.getElementById("compare-trump-winners")).not.toBeNull();
    expect(
      screen.getByText(
        /Category winners under the studio heroes marks Power, 0–60, and Top speed/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /higher Power and Top speed win; lower 0–60 wins; ties stay neutral/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare studio heroes motion is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compare studio heroes motion" }),
    ).toBeInTheDocument();
    expect(document.getElementById("compare-heroes-motion")).not.toBeNull();
    expect(
      screen.getByText(
        /the dual photo-first studio heroes soft-fade and rise in \(right side a beat later\), ease the studio photo a little larger on hover\/focus, and drift a gentle bay light/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Prefers-reduced-motion keeps the heroes still \(no entrance \/ no photo ease \/ no bay pulse\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Challenge from Compare is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Challenge from Compare" })).toBeInTheDocument();
    expect(document.getElementById("compare-challenge")).not.toBeNull();
    expect(
      screen.getByText(
        /Challenge under a studio hero deep-links Play with that member and car ready \(\/play\?opponent=/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Offer trade from Compare is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Offer trade from Compare" })).toBeInTheDocument();
    expect(document.getElementById("compare-offer-trade")).not.toBeNull();
    expect(
      screen.getByText(
        /Offer trade under a studio hero deep-links Trades compose with that member and car ready \(\/trades\?with=/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Challenge stays on the same hero when challengeable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open member from Compare is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open member from Compare" })).toBeInTheDocument();
    expect(document.getElementById("compare-open-member")).not.toBeNull();
    expect(
      screen.getByText(
        /Open member under a studio hero takes you to that owner.?s public garage \(\/members\/:id\) when a member owns that side/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Challenge and Offer trade stay on the same hero when those apply/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open car from Compare is the next step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open car from Compare" })).toBeInTheDocument();
    expect(document.getElementById("compare-open-car")).not.toBeNull();
    expect(
      screen.getByText(
        /Open car under a studio hero takes you to that catalogue listing \(\/cars\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Both sides get the CTA when a listing id is known/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Favourites Top Trumps peek \(same Power \/ 0–60 \/ Top speed\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Top Trumps category winners \(Power \/ 0–60 \/ Top speed, Play rules\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare studio heroes motion \(entrance fade\/rise, photo ease, reduced-motion\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Challenge → Play \(\/play\?opponent=&theirCar=; hidden for self \/ house \/ missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Offer trade → Trades \(\/trades\?with=&theirCar=; hidden for self \/ house \/ missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Open member → \/members\/:id \(hidden for self \/ house \/ missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Open car → \/cars\/:id \(both heroes when listing ids are known\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Favourites Compare into that same tray/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Favourites bay value strip \(favourite count \+ total BC\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/nav Trades badge counts pending offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Match history: Wins\/Losses/i)).toBeInTheDocument();
    expect(
      screen.getByText(/TrumpCard studio motion is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Play TrumpCard studio motion" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /pick and face-off TrumpCards soft-fade and rise in \(face-off right card a beat later\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The winning face-off card adds a soft lime category pulse/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Match history Rematch is the next step/i),
    ).toBeInTheDocument();
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
      screen.getByText(/Open car from Match history is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car takes you to the catalogue listing \(\/cars\/:id\) for your card when a listing id is known/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/and for theirs when known too \(house cards often omit theirs\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open opponent from Match history is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open opponent takes you to that member.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The CTA hides for house, when the opponent is missing, or when the opponent is you/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open profile on a selected Play opponent is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open profile takes you to that member.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The CTA hides for Vs house and when the opponent is you/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Play TrumpCard studio motion \(entrance fade\/rise, photo ease, winner pulse, reduced-motion\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Match history Rematch \(PvP opponent deep-link or house → Play\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Match history Open car \(\/cars\/:id when listing ids are known\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Match history Open opponent \(\/members\/:id on PvP; hidden for house \/ self \/ missing\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Play Open profile \(\/members\/:id when a PvP opponent is selected; hidden for house \/ self\)/i,
      ),
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
      screen.getByText(/Open car from Trades is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car takes you to the catalogue listing \(\/cars\/:id\) for offered and wanted cars when listing ids are known/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open partner on inbox and history is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open partner takes you to the other party.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The CTA hides when the partner is missing or is you/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trade history Offer again \(\/trades\?with=\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Trades Open car \(\/cars\/:id on inbox and history when listing ids are known\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Trades Open partner \(\/members\/:id on inbox and history; hidden for self\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/empty bay with Browse cars \/ My garage \/ Members/i)).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points you to Members or Cars/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Find a review/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Sort reviews is the next step; Open car to the catalogue follows after that/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Video reviews, Sort the bay orders the reel: Newest, Oldest, Title A–Z, or Title Z–A/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clear filters resets search, type, and sort back to Newest/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open car to a related listing is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car on a film card \(or on the review itself\) takes you to the related catalogue listing \(\/cars\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Drag races can show one Open car per lane when both listings are known/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare from a review is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare on a related car queues into the shared tray with Cars \/ Favourites \/ My cars \/ Recently viewed when a listing id is known/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Drag races can show one Compare per lane/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/View reviews from a listing is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /View reviews deep-links into Video reviews Find for that make and model \(\/reviews\?q=Make\+Model\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The CTA hides when nothing in the reel matches/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare, Copy link, and buy stay on the listing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/View seller on a member-owned listing is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /View seller takes you to that seller.?s public garage \(\/members\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The CTA hides for house \/ garage stock \(no member id\) and when you own the car/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps bay strip on a listing is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /one Midnight Garage bay strip sits under the studio hero: Power, 0–60, and Top speed/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the same play stats as Cars \/ Favourites \/ My cars peeks/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Listing studio hero motion is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the photo-first studio hero soft-fades and rises in, eases the studio photo a little larger on hover\/focus, and drifts a gentle bay light/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Prefers-reduced-motion keeps the hero still \(no entrance \/ no photo ease \/ no bay pulse\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /drag races with Sort reviews \(Newest \/ Oldest, Title A–Z \/ Z–A\), Open car \(\/cars\/:id\) when a listing exists, and Reviews Compare into the shared tray when a listing is known/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reviews: Find a review plus Sort the bay/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 wins \+15 BC, 5 wins \+40 BC/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Europe\/London week/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/This week.?s cup standings sit on Play/i)).toBeInTheDocument();
    expect(screen.getByText(/beside the all-time podium on the leaderboard/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ends in countdown ticks to London week end beside the \+50 BC prize callout/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /this week.?s cup standings with an Ends in countdown \(Europe\/London week end, \+50 BC prize\)/i,
      ),
    ).toBeInTheDocument();
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
    expect(screen.getByText(/leaderboard You highlight and Jump to my rank/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /leaderboard highlight Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /leaderboard Open car \(\/cars\/:id when a highlight listing is known; hidden on empty bay\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Find your rank on the leaderboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /your standings row \(and cup \/ podium when you’re there\) shows a You badge/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Jump to my rank scrolls you back \(and clears the filter if needed\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your rank You highlight and Jump to my rank are the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps peek on highlight cars is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top Trumps peek on leaderboard cars" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /each photo-first highlight garage car shows a compact Top Trumps peek under the studio photo: Power, 0–60, and Top speed — the same strip as Cars \/ Favourites \/ My cars/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Empty-bay rows stay without a peek/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Open car from a highlight car is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Open car from leaderboard highlights" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car beside a highlight garage car takes you to that catalogue listing \(\/cars\/:id\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The CTA hides on empty-bay rows with no highlight listing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You badge on your standings \/ cup \/ podium row with Jump to my rank when scrolled away/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /highlight cars with Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed, same as Cars \/ Favourites \/ My cars\), Open car → \/cars\/:id when a highlight listing is known \(hidden on empty bay\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/gift Quick amount chips/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Coin ledger Find entry plus type chips \(All \/ Earn \/ Spend \/ Gift \/ Admin\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /admin coin-adjust Quick amount chips \(\+25 \/ \+50 \/ \+100 \/ \+250 BC\) for Brad and Napwood/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /admin inventory Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Type chips filter All \/ Earn \/ Spend \/ Gift \/ Admin — Earn and Spend follow the money/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/filter with the Gift type chip \(next step\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ledger: Find an entry plus type chips \(All \/ Earn \/ Spend \/ Gift \/ Admin/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Quick amount chips on coin adjust come next; Sort the bay on inventory listings follows; Copy signup link on Family invites is after that; Open listing from inventory follows; Open member from Accounts follows; Open member from Coin adjustments is last/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Copy signup link on Family invites is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open listing to the catalogue is a later step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open member on Accounts and Coin adjustments are later steps/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Quick amount chips \(\+25 \/ \+50 \/ \+100 \/ \+250 BC\) — same chip pattern as gift Quick amount/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sort inventory listings is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Free-form still covers debit corrections/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /On Cars & garages \(Listings\), Sort the bay orders the directory: Highest price, Lowest price, Name A–Z, or Name Z–A/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/same options as Cars \/ My cars \/ Favourites/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Clear filters resets search, group, and sort back to Highest price/i,
      ),
    ).toBeInTheDocument();
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
      screen.getByText(/Top Trumps peek on a public garage is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /each photo-first garage media card shows a compact Top Trumps peek under the studio photo: Power, 0–60, and Top speed — the same strip as Cars, Favourites, and My cars/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Challenge, Offer trade, Copy link, showcase hero, and the photo grid stay/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public garage bay value strip is the next step/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /one Midnight Garage bay strip under the hero shows car count and total Brad Coin value — list prices on cars in that bay/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The strip hides on an empty garage/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Copy garage link stays on Account \/ My cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /public garage Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed, same as Cars \/ Favourites \/ My cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /public garage bay value strip \(car count \+ total BC; hides when empty\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gift Brad Coins on someone else.?s card \(not yourself\) deep-links/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/#gift-coins/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Copy link on their profile shares that bay/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Quick amount chip \(10 \/ 25 \/ 50 BC\)/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Gift sent \/ Gift received/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Gifts/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/member gifts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Daily login/i).length).toBeGreaterThan(0);

    expect(
      screen.getByText(
        /login streak bay strip: today.?s \+25 BC status and progress toward day 3 \(\+15\) \/ day 7 \(\+50\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Recently viewed Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed, same as Cars \/ Favourites\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Family activity Open car → \/cars\/:id when a listing is known \(hidden for gifts \/ missing; sign in\); Family activity Open member → \/members\/:id when an actor is known \(hidden for self \/ missing \/ house; sign in\); Latest \/ Featured reviews Open car → \/cars\/:id when a listing is known \(hidden when missing; Watch stays\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
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
        /Open car → \/cars\/:id when listing ids are known; Open opponent → \/members\/:id on PvP \(hidden for house \/ self \/ missing\); Rematch deep-links the same PvP opponent into Play, or Rematch vs house → Play/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Completed\/Declined chips/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(
        /Open car → \/cars\/:id when listing ids are known; Open partner → \/members\/:id; Offer again deep-links the other party into Trades \(\/trades\?with=/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open car → \/cars\/:id for offered and wanted cars when listing ids are known; Open partner → \/members\/:id on incoming and outgoing offers \(hidden for self\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/start from a listing.?s Compare CTA \(tray picks/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare on Favourites \/ Cars \/ My cars \/ Reviews, or Compare on home Recently viewed/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /dual studio heroes motion \(entrance fade\/rise, photo ease; reduced-motion keeps still\); Category winners under the studio heroes for Power \/ 0–60 \/ Top speed \(Play rules; ties neutral\); Open car → \/cars\/:id on both heroes; Challenge → \/play\?opponent=&theirCar=, Offer trade → \/trades\?with=&theirCar=, and Open member → \/members\/:id on a member-owned hero \(hidden for self \/ house \/ missing\); empty bay sends you to Favourites or Browse cars/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /bay value strip \(favourite count \+ total BC when you have saves\); Find a favourite, Sort the bay; Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed, same as Cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points to Members \/ Browse cars for sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer trade or Challenge to Top Trumps/i)).toBeInTheDocument();
    expect(screen.getByText(/header balance chip/i)).toBeInTheDocument();
    expect(screen.getByText(/nav badge = pending offers/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find a car; Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A, same as Favourites\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Find an entry; type chips All \/ Earn \/ Spend \/ Gift \/ Admin/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Login streak/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/This week.?s cup standings beside the podium/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ends in countdown to Europe\/London week end · \+50 BC prize/i,
      ),
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
      screen.getByText(
        /open a garage \(bay value strip with car count \+ total BC when they have cars; Top Trumps peek under each studio photo: Power \/ 0–60 \/ Top speed, same as Cars \/ Favourites \/ My cars\) or Copy link on their profile/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Compare garage cards into the same tray as Cars/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed, same as Cars \/ Favourites\) on owned and for-sale cards/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /bay value strip \(owned count \+ total BC for cars you hold; sold history excluded; hides when empty\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Quick price chips \(50 \/ 100 \/ 250 \/ 500 BC\) or free-form when listing \/ updating a sale; Paint colour \(same curated studio paints as admin\) with a live studio thumb/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pin your showcase, and Copy garage link \(same URL as profile Copy link\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/display name, bio, and Copy garage link for your public/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.getAllByRole("link", { name: "Open Home" }).length).toBeGreaterThanOrEqual(5);
    expect(
      screen.getAllByRole("link", { name: "Open Home" }).every((a) => a.getAttribute("href") === "/"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Cars" }).length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByRole("link", { name: "Open Cars" })[0]).toHaveAttribute("href", "/cars");
    expect(
      screen.getByText(
        /on a listing, Top Trumps bay strip under the studio hero \(same Power \/ 0–60 \/ Top speed\); listing studio hero motion \(entrance fade\/rise, photo ease; reduced-motion keeps still\); View reviews → \/reviews\?q=Make\+Model when films exist \(hides when none\); View seller → \/members\/:id when a member owns it \(hidden for self or house\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try Cars search" })).toHaveAttribute("href", "/cars");
    expect(
      screen.getByText(
        /Find \+ filters; Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A, same as Favourites \/ My cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /studio card hover motion \(bay lift, photo ease, lime\/rose edge; reduced-motion keeps still\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Top Trumps peek under each studio photo \(Power \/ 0–60 \/ Top speed\)/i,
      ).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByRole("link", { name: "Cars" }).some((el) => el.getAttribute("href") === "/cars"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Favourites" }).length).toBeGreaterThanOrEqual(4);
    expect(
      screen
        .getAllByRole("link", { name: "Open Favourites" })
        .every((a) => a.getAttribute("href") === "/favourites"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Compare" }).length).toBeGreaterThanOrEqual(6);
    expect(
      screen.getAllByRole("link", { name: "Open Compare" }).every((a) => a.getAttribute("href") === "/compare"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open My cars" }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByRole("link", { name: "Open My cars" })[0]).toHaveAttribute(
      "href",
      "/garage",
    );
    expect(screen.getAllByRole("link", { name: "Open Play" }).length).toBeGreaterThanOrEqual(3);
    expect(
      screen.getAllByRole("link", { name: "Open Play" }).every((a) => a.getAttribute("href") === "/play"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Match history" }).length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      screen
        .getAllByRole("link", { name: "Open Match history" })
        .every((a) => a.getAttribute("href") === "/play/history"),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: "Play" }).some((a) => a.getAttribute("href") === "/play"),
    ).toBe(true);
    expect(
      screen.getByText(
        /Challenge a member or land from Rematch \(\/play\?opponent=\); TrumpCard studio motion \(entrance fade\/rise, photo ease, winner pulse; reduced-motion keeps still\); Open profile → \/members\/:id when an opponent is selected \(hidden for house or self\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open cup standings" })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(screen.getAllByRole("link", { name: "Open Leaderboard" }).length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      screen
        .getAllByRole("link", { name: "Open Leaderboard" })
        .every((a) => a.getAttribute("href") === "/leaderboard"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Trades" }).length).toBeGreaterThanOrEqual(2);
    expect(
      screen
        .getAllByRole("link", { name: "Open Trades" })
        .every((a) => a.getAttribute("href") === "/trades"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Trade history" }).length).toBeGreaterThanOrEqual(
      2,
    );
    expect(
      screen
        .getAllByRole("link", { name: "Open Trade history" })
        .every((a) => a.getAttribute("href") === "/trades/history"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Open Reviews" }).length).toBeGreaterThanOrEqual(4);
    expect(
      screen
        .getAllByRole("link", { name: "Open Reviews" })
        .every((a) => a.getAttribute("href") === "/reviews"),
    ).toBe(true);
    expect(
      screen.getByText(
        /Find a review; Cue card \/ Drag race chips; Sort the bay \(Newest \/ Oldest, Title A–Z \/ Z–A\); Open car → \/cars\/:id when a listing exists; Compare into the shared tray when a listing is known; Copy link on a film/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Coin ledger" })).toHaveAttribute(
      "href",
      "/ledger",
    );
    expect(screen.getByRole("link", { name: "Open Account" })).toHaveAttribute("href", "/account");
    expect(screen.getAllByRole("link", { name: "Open Members" }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/gift Brad Coins/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Open Admin" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Coin adjustments" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Cars & garages" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Family invites" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Accounts" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Brad & Napwood: Find a member; balance chips; Clear filters; Open member → \/members\/:id on Adjust balance and Recent adjustments/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coin adjustments" })).toHaveAttribute(
      "href",
      "/admin/coin-history",
    );
    expect(screen.getByRole("link", { name: "Accounts" })).toHaveAttribute("href", "/admin/users");
    expect(
      screen.getByText(
        /Brad & Napwood: Find a listing; Sort the bay \(Highest \/ Lowest price, Name A–Z \/ Z–A, same as Cars \/ My cars\)/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cars & garages" })).toHaveAttribute(
      "href",
      "/admin/inventory",
    );
    expect(screen.getByRole("link", { name: "Family invites" })).toHaveAttribute(
      "href",
      "/admin/invites",
    );
  });
});
