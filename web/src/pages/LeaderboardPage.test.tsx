import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { LeaderboardPage } from "./LeaderboardPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchLeaderboard: vi.fn(),
}));

import * as api from "../api";

describe("LeaderboardPage garage photos", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "member@example.com",
        displayName: "Member",
        bio: null,
        role: "member",
        coinBalance: 500,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 500,
      },
    });
    vi.mocked(api.fetchLeaderboard).mockResolvedValue({
      entries: [
        {
          rank: 1,
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay and loves a fair trade on weekends.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 1025,
          topTrumpsWins: 3,
          highlightCar: {
            id: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
            bodyType: "Coupe",
            colour: "Racing Red",
            coinPrice: 420,
          },
        },
        {
          rank: 2,
          id: 2,
          displayName: "Member",
          bio: null,
          role: "member",
          roleLabel: "Member",
          coinBalance: 500,
          topTrumpsWins: 0,
          highlightCar: null,
        },
      ],
    });
  });

  it("shows highlight studio photo, bio snippet, and links rows to public garages", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LeaderboardPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Brad Coin leaderboard" })).toBeInTheDocument();

    const garageLink = await screen.findByRole("link", {
      name: /Bay Friend, rank 1, open garage/i,
    });
    expect(garageLink).toHaveAttribute("href", "/members/7");
    expect(garageLink).toHaveTextContent("1,025 BC");
    expect(garageLink).toHaveTextContent("3 Top Trumps wins");
    expect(garageLink).toHaveTextContent(/Collects pace/i);

    const img = garageLink.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    const selfLink = screen.getByRole("link", { name: /Member \(you\), rank 2, open garage/i });
    expect(selfLink).toHaveAttribute("href", "/members/2");
    expect(selfLink).toHaveTextContent("Empty bay");
  });
});
