import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { TopTrumpsPage } from "./TopTrumpsPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchTopTrumpsCategories: vi.fn(),
  fetchTopTrumpsStreak: vi.fn(),
  fetchWeeklyCup: vi.fn(),
  fetchGarage: vi.fn(),
  fetchMembers: vi.fn(),
  fetchMemberCards: vi.fn(),
}));

import * as api from "../api";

describe("TopTrumpsPage Midnight Garage UI", () => {
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
        coinBalance: 400,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 400,
      },
    });
    vi.mocked(api.fetchTopTrumpsCategories).mockResolvedValue({
      categories: [
        { id: "bhp", label: "Power (bhp)", direction: "higher" },
        { id: "top_speed_mph", label: "Top speed", direction: "higher" },
        { id: "zero_to_sixty_secs", label: "0–60", direction: "lower" },
      ],
      rewards: { win: 25, play: 5 },
      streakMilestones: [
        { streak: 3, coins: 15 },
        { streak: 5, coins: 40 },
      ],
    });
    vi.mocked(api.fetchTopTrumpsStreak).mockResolvedValue({
      streak: 2,
      milestones: [
        { streak: 3, coins: 15 },
        { streak: 5, coins: 40 },
      ],
    });
    vi.mocked(api.fetchWeeklyCup).mockResolvedValue({
      timezone: "Europe/London",
      weekKey: "2026-W46",
      weekStart: "2026-11-09T00:00:00.000Z",
      weekEnd: "2026-11-16T00:00:00.000Z",
      prizeAmount: 50,
      standings: [{ userId: 2, displayName: "Member", wins: 2, rank: 1 }],
      previousAward: {
        weekKey: "2026-W45",
        winnerUserId: 7,
        displayName: "Bay Friend",
        wins: 4,
        prizeAmount: 50,
        alreadyAwarded: true,
      },
    });
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 420,
      showcaseListingId: null,
      cars: [
        {
          id: 9,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          conditionType: "used",
          year: 2022,
          colour: "Racing Red",
          mileage: 12000,
          coinPrice: 420,
          status: "owned",
          ownerLabel: "You",
          garageName: "Bay",
          garageCity: "London",
        },
      ],
    });
    vi.mocked(api.fetchMembers).mockResolvedValue({
      members: [
        {
          id: 177,
          displayName: "Sam Bay",
          bio: null,
          role: "member",
          roleLabel: "Member",
          carCount: 2,
          coinBalance: 300,
        },
      ],
    });
    vi.mocked(api.fetchMemberCards).mockResolvedValue({ cards: [] });
  });

  it("shows bay hierarchy, House vs Challenge modes, and match history entry", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/play"]}>
        <AuthProvider>
          <ToastProvider>
            <TopTrumpsPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Top Trumps" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(screen.getByText(/Win \+25 BC/i)).toBeInTheDocument();
    expect(await screen.findByText(/Win streak ×2/i)).toBeInTheDocument();
    expect(screen.getByText(/3 wins \+15 BC/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Top Trumps cup" })).toBeInTheDocument();
    expect(screen.getByLabelText("This week Top Trumps cup standings")).toBeInTheDocument();

    const historyLinks = screen.getAllByRole("link", { name: /Match history/i });
    expect(historyLinks.some((link) => link.getAttribute("href") === "/play/history")).toBe(true);

    const house = await screen.findByRole("button", {
      name: /Vs house.*Random house card/i,
    });
    const challenge = screen.getByRole("button", {
      name: /Challenge a member.*Pick who you face/i,
    });
    expect(house).toHaveAttribute("aria-pressed", "true");
    expect(challenge).toHaveAttribute("aria-pressed", "false");

    await user.click(challenge);
    expect(challenge).toHaveAttribute("aria-pressed", "true");
    expect(house).toHaveAttribute("aria-pressed", "false");
    expect(await screen.findByRole("status")).toHaveTextContent(/Challenge started/i);
  });
});
