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
  fetchFeaturedReview: vi.fn().mockResolvedValue({ review: null }),
}));

import * as api from "../api";

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(api.fetchReviews).mockResolvedValue({ reviews: [] });
    vi.mocked(api.fetchFeaturedReview).mockResolvedValue({ review: null });
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
          featured: false,
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

  it("shows a featured review pinned on home", async () => {
    vi.mocked(api.fetchFeaturedReview).mockResolvedValue({
      review: {
        id: 11,
        title: "Pinned drag — GT-R",
        status: "published",
        createdAt: "2026-11-09T11:00:00.000Z",
        publisher: { id: 1, displayName: "Brad" },
        car: {
          id: 8,
          make: "Nissan",
          model: "GT-R",
          trimName: "",
          bhp: 570,
          topSpeedMph: 196,
          zeroToSixtySecs: 2.9,
        },
        cueCards: [],
        videoUrl: "/reviews/11/video",
        mimeType: "video/webm",
        likeCount: 12,
        likedByMe: false,
        featured: true,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Featured bay review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pinned from the bay" })).toBeInTheDocument();
    const featured = screen.getByRole("link", { name: /Pinned drag — GT-R/i });
    expect(featured).toHaveAttribute("href", "/reviews/11");
    expect(screen.getByText("Watch featured →")).toBeInTheDocument();
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
