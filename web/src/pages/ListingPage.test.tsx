import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import type { ListingDetail } from "../cars";
import { COMPARE_SELECTION_KEY, clearCompareSelection } from "../compare-selection";
import { ToastProvider } from "../toast-context";
import { ListingPage } from "./ListingPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchListing: vi.fn(),
  fetchReviews: vi.fn(),
}));

vi.mock("../share-link", async () => {
  const actual = await vi.importActual<typeof import("../share-link")>("../share-link");
  return {
    ...actual,
    copyTextToClipboard: vi.fn(),
  };
});

import * as api from "../api";
import { copyTextToClipboard } from "../share-link";

const memberOwnedListing: ListingDetail = {
  id: 143,
  make: "Bugatti",
  model: "Chiron",
  trimName: "Sport",
  bodyType: "Coupe",
  fuel: "Petrol",
  drivetrain: "AWD",
  bhp: 1479,
  topSpeedMph: 261,
  zeroToSixtySecs: 2.3,
  conditionType: "used",
  year: 2021,
  colour: "Arctic White",
  mileage: 138900,
  coinPrice: 549,
  ownerLabel: "Sam Bay",
  ownerUserId: 177,
  status: "available",
  garageName: "Thames Valley Stock",
  garageCity: "Reading",
  doors: 2,
  seats: 2,
  garageTagline: "Commuters and hot hatches.",
};

describe("ListingPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    clearCompareSelection();
  });

  beforeEach(() => {
    clearCompareSelection();
    vi.mocked(api.fetchListing).mockResolvedValue({
      listing: memberOwnedListing,
      favourited: false,
    });
    vi.mocked(api.fetchReviews).mockResolvedValue({ reviews: [] });
  });

  it("shows bay hierarchy, hero, specs, and Challenge / trade CTAs when signed in", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
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

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /Bugatti Chiron Sport/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Listing · Midnight garage/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Listing status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Specs & bay" })).toBeInTheDocument();
    expect(screen.getByLabelText("Listing actions")).toBeInTheDocument();

    const hero = screen.getByRole("img", { name: /Bugatti Chiron Sport/i });
    expect(hero.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(screen.getByLabelText("Listing bay photo")).toBeInTheDocument();
    expect(document.querySelector('[data-bay-frame="hero"]')).not.toBeNull();

    // Top Trumps bay strip sits under the studio hero (same Power / 0–60 / Top speed as peeks).
    const trumpStrip = screen.getByLabelText("Top Trumps bay strip");
    expect(trumpStrip).toBeInTheDocument();
    expect(within(trumpStrip).getByText("Power")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("0–60")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("Top speed")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("1479")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("2.3s")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("261 mph")).toBeInTheDocument();
    expect(within(trumpStrip).getByText("Top Trumps · Play stats")).toBeInTheDocument();

    const challenge = screen.getByRole("link", { name: "Challenge to Top Trumps" });
    expect(challenge).toHaveAttribute("href", "/play?opponent=177&theirCar=143");
    const trade = screen.getByRole("link", { name: "Offer trade" });
    expect(trade).toHaveAttribute("href", "/trades?with=177&theirCar=143");
    expect(screen.getByRole("button", { name: /Buy for/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save to favourites/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View seller Sam Bay" })).toHaveAttribute(
      "href",
      "/members/177",
    );
    expect(screen.queryByRole("link", { name: "View reviews" })).not.toBeInTheDocument();
  });

  it("hides View seller when the viewer owns the listing", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 177,
        email: "sam@example.com",
        displayName: "Sam Bay",
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

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Bugatti Chiron Sport/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View seller/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("hides View seller on house / garage-only stock with no member id", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
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
    vi.mocked(api.fetchListing).mockResolvedValue({
      listing: { ...memberOwnedListing, ownerUserId: null, ownerLabel: "Bay stock" },
      favourited: false,
    });

    render(
      <MemoryRouter initialEntries={["/cars/99"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Bugatti Chiron Sport/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View seller/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("links View reviews into Find when matching films exist, keeps Compare / Copy / Buy", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
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
    vi.mocked(api.fetchReviews).mockResolvedValue({
      reviews: [
        {
          id: 9,
          type: "review",
          title: "Bay burn — Chiron",
          status: "published",
          createdAt: "2026-11-09T12:00:00.000Z",
          publisher: { id: 1, displayName: "Brad" },
          car: {
            id: 8,
            make: "Bugatti",
            model: "Chiron",
            trimName: "Sport",
            bodyType: "Coupe",
            colour: "Midnight Black",
            bhp: 1479,
            topSpeedMph: 261,
            zeroToSixtySecs: 2.3,
            listingId: 143,
            listingYear: 2020,
            listingCoinPrice: 900,
          },
          carB: null,
          cueCards: [],
          videoUrl: "/reviews/9/video",
          mimeType: "video/webm",
          likeCount: 0,
          likedByMe: false,
          featured: false,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const viewReviews = await screen.findByRole("link", { name: "View reviews" });
    expect(viewReviews).toHaveAttribute("href", "/reviews?q=Bugatti+Chiron");
    expect(screen.getByRole("link", { name: "View seller Sam Bay" })).toHaveAttribute(
      "href",
      "/members/177",
    );
    expect(screen.getByRole("button", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buy for/i })).toBeInTheDocument();
  });

  it("queues the listing for compare and opens the compare bay", async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
              <Route path="/compare" element={<div>Compare bay</div>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Compare" }));
    expect(await screen.findByText("Compare bay")).toBeInTheDocument();
    const raw = sessionStorage.getItem(COMPARE_SELECTION_KEY);
    expect(raw).toContain('"id":143');
    // Buy / favourite / challenge-or-trade / copy stay on the listing route before navigate.
  });

  it("opens side-by-side when a second compare pick is already queued", async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    sessionStorage.setItem(
      COMPARE_SELECTION_KEY,
      JSON.stringify([
        {
          id: 9,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          year: 2022,
          coinPrice: 420,
        },
      ]),
    );
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
              <Route path="/compare" element={<div data-testid="compare-route">Compare bay</div>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Compare" }));
    expect(await screen.findByTestId("compare-route")).toBeInTheDocument();
    // MemoryRouter keeps path; assert queued pair via session storage href contract.
    const picks = JSON.parse(sessionStorage.getItem(COMPARE_SELECTION_KEY) ?? "[]") as {
      id: number;
    }[];
    expect(picks.map((p) => p.id)).toEqual([9, 143]);
  });

  it("copies the absolute listing URL with a success toast", async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Copy link" }));
    expect(copyTextToClipboard).toHaveBeenCalled();
    const copied = vi.mocked(copyTextToClipboard).mock.calls[0]?.[0] ?? "";
    expect(copied).toMatch(/\/cars\/143$/);
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
    // Buy / favourite / challenge-or-trade stay available beside Copy link.
    expect(screen.getByRole("button", { name: /Sign in to buy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in to favourite/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign in to challenge or trade" }),
    ).toBeInTheDocument();
  });

  it("prompts sign-in to challenge or trade when signed out", async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: "Sign in to challenge or trade" }),
    ).toHaveAttribute("href", "/signin");
    expect(screen.queryByRole("link", { name: "Challenge to Top Trumps" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Offer trade" })).not.toBeInTheDocument();
  });
});
