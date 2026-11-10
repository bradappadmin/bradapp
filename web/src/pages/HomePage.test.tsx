import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import {
  COMPARE_SELECTION_KEY,
  clearCompareSelection,
  loadCompareSelection,
} from "../compare-selection";
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
    clearCompareSelection();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(api.fetchReviews).mockResolvedValue({ reviews: [] });
    vi.mocked(api.fetchFeaturedReview).mockResolvedValue({ review: null });
    window.localStorage.clear();
    clearCompareSelection();
  });

  it("shows latest published reviews with watch and Open car links on home", async () => {
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
            listingId: 55,
            listingYear: 2019,
            listingCoinPrice: 120,
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
    expect(screen.getByRole("link", { name: "Open car Ford Focus" })).toHaveAttribute(
      "href",
      "/cars/55",
    );
  });

  it("hides Open car on latest reviews when no listing is known", async () => {
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
            listingId: null,
            listingYear: null,
            listingCoinPrice: null,
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

    expect(await screen.findByRole("link", { name: /Bay burn — Focus ST/i })).toBeInTheDocument();
    expect(screen.getByText("Watch →")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open car/i })).not.toBeInTheDocument();
  });

  it("shows a featured review pinned on home with Open car when listing is known", async () => {
    vi.mocked(api.fetchFeaturedReview).mockResolvedValue({
      review: {
        id: 11,
        type: "drag_race",
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
          listingId: 88,
          listingYear: 2020,
          listingCoinPrice: 500,
        },
        carB: {
          id: 9,
          make: "Porsche",
          model: "911",
          trimName: "Turbo",
          bodyType: "Coupe",
          colour: "Racing Red",
          bhp: 572,
          topSpeedMph: 205,
          zeroToSixtySecs: 2.7,
          listingId: 91,
          listingYear: 2021,
          listingCoinPrice: 620,
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
    expect(screen.getByRole("link", { name: "Open car Nissan GT-R" })).toHaveAttribute(
      "href",
      "/cars/88",
    );
    expect(screen.getByRole("link", { name: "Open car Porsche 911" })).toHaveAttribute(
      "href",
      "/cars/91",
    );
  });

  it("hides Open car on featured review when no listing is known", async () => {
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
          listingId: null,
          listingYear: null,
          listingCoinPrice: null,
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

    expect(await screen.findByRole("link", { name: /Pinned drag — GT-R/i })).toBeInTheDocument();
    expect(screen.getByText("Watch featured →")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open car/i })).not.toBeInTheDocument();
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
    expect(
      screen.getByText(/Top Trumps peek under the studio photo \(Power \/ 0–60 \/ Top speed\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Top Trumps peek")).toBeInTheDocument();
    expect(screen.getByLabelText("Recently viewed bay notes")).toBeInTheDocument();
    // Media cards reuse the catalogue Top Trumps peek under the studio photo.
    const peeks = screen.getAllByLabelText("Top Trumps peek");
    expect(peeks.length).toBeGreaterThanOrEqual(1);
    expect(peeks[0].textContent).toMatch(/Power/);
    expect(peeks[0].textContent).toMatch(/0–60/);
    expect(peeks[0].textContent).toMatch(/Top speed/);
    expect(screen.getByText("502")).toBeInTheDocument();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("197 mph")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to compare" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Compare" }).some((a) => a.getAttribute("href") === "/compare"),
    ).toBe(true);
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();
  });

  it("queues Recently viewed cars into the shared compare tray", async () => {
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
        {
          id: 7,
          make: "Ford",
          model: "Focus",
          trimName: "ST",
          bodyType: "Hatchback",
          colour: "Blue",
          year: 2019,
          bhp: 280,
          topSpeedMph: 155,
          zeroToSixtySecs: 5.7,
          coinPrice: 180,
          status: "available",
          viewedAt: Date.now() - 1000,
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
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Add to compare" })[0]!);
    expect(screen.getByLabelText("Compare selection")).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1\/2\)/i)).toBeInTheDocument();
    expect(loadCompareSelection()).toHaveLength(1);
    expect(loadCompareSelection()[0]?.id).toBe(42);

    await user.click(screen.getAllByRole("button", { name: "Add to compare" })[0]!);
    expect(screen.getByText(/Compare \(2\/2\)/i)).toBeInTheDocument();
    expect(loadCompareSelection()).toHaveLength(2);
    expect(sessionStorage.getItem(COMPARE_SELECTION_KEY)).toBeTruthy();
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
    expect(screen.queryByRole("button", { name: "Add to compare" })).not.toBeInTheDocument();
    const browseLinks = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browseLinks.some((a) => a.getAttribute("href") === "/cars")).toBe(true);
    expect(
      screen.getAllByRole("link", { name: "Compare" }).some((a) => a.getAttribute("href") === "/compare"),
    ).toBe(true);
  });

  it("clears recently viewed from home after confirm and shows the empty bay", async () => {
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
    expect(screen.getByRole("button", { name: "Confirm clear" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
    expect(window.localStorage.getItem(RECENTLY_VIEWED_KEY)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByText(/Porsche/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Confirm clear" }));
    expect(screen.getByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByLabelText("Empty recently viewed bay")).toBeInTheDocument();
    expect(screen.getByText("Empty bay")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm clear" })).not.toBeInTheDocument();
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
    const banner = screen.getByLabelText("Daily login and login streak");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Today.?s \+25 BC claimed/i);
    expect(banner).toHaveTextContent(/Login streak ×3 · 4 more London days to day 7/i);
    expect(
      screen.getAllByRole("link", { name: "Coin ledger" }).some((a) => a.getAttribute("href") === "/ledger"),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "How to" })
        .some((a) => a.getAttribute("href") === "/how-to#daily-login"),
    ).toBe(true);
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
