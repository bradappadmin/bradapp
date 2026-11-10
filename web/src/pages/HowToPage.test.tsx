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
    expect(
      screen.getByRole("heading", { name: "Favourites: challenge and trade" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Play Top Trumps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekly Top Trumps cup" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Free card trades" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reviews and drag races" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your bay profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gift Brad Coins" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admin for Brad and Napwood" }),
    ).toBeInTheDocument();

    expect(screen.getByText(/invite codes are optional/i)).toBeInTheDocument();
    expect(screen.getAllByText(/daily login bonus/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\+25 Brad Coins/i)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London calendar day/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily login claimed/i)).toBeInTheDocument();
    expect(screen.getByText(/No second credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Find, filters, and price sort/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy link puts the absolute URL/i)).toBeInTheDocument();
    expect(screen.getByText(/header balance for your ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer trade and Challenge to Top Trumps/i)).toBeInTheDocument();
    expect(screen.getByText(/nav Favourites badge shows how many/i)).toBeInTheDocument();
    expect(screen.getByText(/nav Trades badge counts pending offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Match history: Wins\/Losses/i)).toBeInTheDocument();
    expect(screen.getByText(/Trades history: Completed\/Declined/i)).toBeInTheDocument();
    expect(screen.getByText(/empty bay with Browse cars \/ My garage \/ Members/i)).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points you to Members or Cars/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Find a review/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/3 wins \+15 BC, 5 wins \+40 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London week/i)).toBeInTheDocument();
    expect(screen.getByText(/This week.?s cup standings sit on Play/i)).toBeInTheDocument();
    expect(screen.getByText(/beside the all-time podium on the leaderboard/i)).toBeInTheDocument();
    expect(screen.getByText(/pin one showcase car/i)).toBeInTheDocument();
    expect(screen.getByText(/Gift coins: enter an amount and an optional note/i)).toBeInTheDocument();
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
    expect(screen.getByText(/Wins\/Losses chips/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed\/Declined chips/i)).toBeInTheDocument();
    expect(screen.getByText(/empty bay sends you to Favourites or Browse cars/i)).toBeInTheDocument();
    expect(screen.getByText(/empty inbox points to Members \/ Browse cars for sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer trade or Challenge to Top Trumps/i)).toBeInTheDocument();
    expect(screen.getByText(/header balance chip/i)).toBeInTheDocument();
    expect(screen.getByText(/nav badge = pending offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Find a car, Sort the bay/i)).toBeInTheDocument();
    expect(screen.getAllByText(/reason chips/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/This week.?s cup standings beside the podium/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Open Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Open Cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Try Cars search" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Open Favourites" })).toHaveAttribute(
      "href",
      "/favourites",
    );
    expect(screen.getByRole("link", { name: "Open Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Open cup standings" })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(screen.getByRole("link", { name: "Open Trades" })).toHaveAttribute("href", "/trades");
    expect(screen.getByRole("link", { name: "Open Reviews" })).toHaveAttribute("href", "/reviews");
    expect(screen.getByRole("link", { name: "Open Account" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Open Members" })).toHaveAttribute("href", "/members");
    expect(screen.getAllByText(/gift Brad Coins/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Open Admin" })).not.toBeInTheDocument();
  });
});
