import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { RECENTLY_VIEWED_KEY } from "../recently-viewed";
import { HomePage } from "./HomePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchActivity: vi.fn().mockResolvedValue({ items: [] }),
  fetchReviews: vi.fn().mockResolvedValue({ reviews: [] }),
}));

import * as api from "../api";

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(api.fetchReviews).mockResolvedValue({ reviews: [] });
    window.localStorage.clear();
  });

  it("shows latest published reviews with watch links on home", async () => {
    vi.mocked(api.fetchReviews).mockResolvedValue({
      reviews: [
        {
          id: 9,
          title: "Bay burn — Focus ST",
          status: "published",
          createdAt: "2026-11-09T12:00:00.000Z",
          publisher: { id: 1, displayName: "Brad" },
          car: {
            id: 3,
            make: "Ford",
            model: "Focus",
            trimName: "ST",
            bhp: 280,
            topSpeedMph: 155,
            zeroToSixtySecs: 5.7,
          },
          cueCards: [],
          videoUrl: "/reviews/9/video",
          mimeType: "video/webm",
          likeCount: 3,
          likedByMe: false,
        },
      ],
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Latest bay reviews" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest reviews" })).toBeInTheDocument();
    const watch = await screen.findByRole("link", { name: /Bay burn — Focus ST/i });
    expect(watch).toHaveAttribute("href", "/reviews/9");
    expect(screen.getByText("Watch →")).toBeInTheDocument();
    expect(screen.getByText(/3 likes/)).toBeInTheDocument();
  });

  it("shows recently viewed cars from localStorage on home", async () => {
    window.localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify([
        {
          id: 42,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          colour: "Racing Red",
          year: 2022,
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          coinPrice: 420,
          status: "available",
          viewedAt: Date.now(),
        },
      ]),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently viewed" })).toBeInTheDocument();
    expect(screen.getByText(/Porsche 911 GT3/i)).toBeInTheDocument();
  });

  it("shows BradApp brand and auth links when signed out", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("BradApp")).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Cars" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "How to" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Play" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Reviews" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("region", { name: "First visit tips" })).not.toBeInTheDocument();
  });

  it("shows dismissible first-visit tips after sign-in, including Admin for admins", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 3,
        email: "bradapp.admin@gmail.com",
        displayName: "Brad",
        role: "admin",
        coinBalance: 1000,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 1000,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const tips = await screen.findByRole("region", { name: "First visit tips" });
    expect(screen.getByRole("heading", { name: "Quick tips" })).toBeInTheDocument();
    expect(tips).toHaveTextContent("Cars");
    expect(tips).toHaveTextContent("Play");
    expect(tips).toHaveTextContent("Trades");
    expect(tips).toHaveTextContent("Reviews");
    expect(tips).toHaveTextContent("Admin");
  });
});
