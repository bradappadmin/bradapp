import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { RECENTLY_VIEWED_KEY } from "../recently-viewed";
import { ToastProvider } from "../toast-context";
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
          type: "review",
          title: "Bay burn — Focus ST",
          status: "published",
          createdAt: "2026-11-09T12:00:00.000Z",
          publisher: { id: 1, displayName: "Brad" },
          car: {
            id: 3,
            make: "Ford",
            model: "Focus",
            trimName: "ST",
            bodyType: "Hatchback",
            colour: "Midnight Black",
            bhp: 280,
            topSpeedMph: 155,
            zeroToSixtySecs: 5.7,
          },
          carB: null,
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
          <ToastProvider>
            <HomePage />
          </ToastProvider>
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
        type: "review",
        title: "Pinned drag — GT-R",
        status: "published",
        createdAt: "2026-11-09T11:00:00.000Z",
        publisher: { id: 1, displayName: "Brad" },
        car: {
          id: 8,
          make: "Nissan",
          model: "GT-R",
          trimName: "",
          bodyType: "Coupe",
          colour: "Midnight Black",
          bhp: 570,
          topSpeedMph: 196,
          zeroToSixtySecs: 2.9,
        },
        carB: null,
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
          <ToastProvider>
            <HomePage />
          </ToastProvider>
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
          <ToastProvider>
            <HomePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently viewed" })).toBeInTheDocument();
    expect(screen.getByText(/Porsche 911 GT3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("shows Empty bay and Browse cars when recently viewed is empty", async () => {
    window.localStorage.removeItem(RECENTLY_VIEWED_KEY);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <HomePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently viewed" })).toBeInTheDocument();
    expect(screen.getByLabelText("Empty recently viewed bay")).toBeInTheDocument();
    expect(screen.getByText("Empty bay")).toBeInTheDocument();
    expect(screen.getByText(/No listings on this device yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    const browseLinks = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browseLinks.some((a) => a.getAttribute("href") === "/cars")).toBe(true);
  });

  it("clears recently viewed from home and shows the empty bay", async () => {
    const user = userEvent.setup();
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
          <ToastProvider>
            <HomePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByLabelText("Empty recently viewed bay")).toBeInTheDocument();
    expect(screen.getByText("Empty bay")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(RECENTLY_VIEWED_KEY)).toBeNull();
    expect(screen.getByText(/Cleared recently viewed on this device/i)).toBeInTheDocument();
  });

  it("shows BradApp brand and auth links when signed out", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <HomePage />
          </ToastProvider>
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

  it("toasts when the daily login bonus was just claimed on load", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 4,
        email: "member@example.com",
        displayName: "Member",
        bio: null,
        role: "member",
        coinBalance: 125,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-10",
        claimedToday: true,
        claimedJustNow: true,
        balance: 140,
        streak: 3,
        streakBonusAwarded: 15,
        streakMilestones: [
          { streak: 3, coins: 15 },
          { streak: 7, coins: 50 },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <HomePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Daily login claimed/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-11-10 · Europe\/London/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Login streak 3")).toBeInTheDocument();
    expect(
      await screen.findByText(
        /Daily login \+25 BC · streak ×3 · \+15 streak BC · 2026-11-10 \(Europe\/London\)/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows dismissible first-visit tips after sign-in, including Admin for admins", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 3,
        email: "bradapp.admin@gmail.com",
        displayName: "Brad",
        bio: null,
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
          <ToastProvider>
            <HomePage />
          </ToastProvider>
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
