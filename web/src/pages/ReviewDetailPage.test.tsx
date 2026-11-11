import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import {
  clearCompareSelection,
  loadCompareSelection,
} from "../compare-selection";
import { ToastProvider } from "../toast-context";
import { ReviewDetailPage } from "./ReviewDetailPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchReview: vi.fn(),
  likeReview: vi.fn(),
  unlikeReview: vi.fn(),
  featureReview: vi.fn(),
  unfeatureReview: vi.fn(),
  unpublishReview: vi.fn(),
  reviewVideoSrc: (url: string) => url,
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

const publishedReview = {
  id: 9,
  type: "review" as const,
  title: "Bay burn — Focus ST",
  status: "published" as const,
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
    listingId: 143,
    listingYear: 2019,
    listingCoinPrice: 180,
  },
  carB: null,
  cueCards: [{ id: "c1", title: "Look", prompt: "Walk around" }],
  videoUrl: "/reviews/9/video",
  mimeType: "video/webm",
  likeCount: 0,
  likedByMe: false,
  featured: false,
};

const dragRaceReview = {
  ...publishedReview,
  id: 12,
  type: "drag_race" as const,
  title: "Bay drag — ST vs Type R",
  carB: {
    id: 4,
    make: "Honda",
    model: "Civic",
    trimName: "Type R",
    bodyType: "Hatchback",
    colour: "Racing Red",
    bhp: 315,
    topSpeedMph: 169,
    zeroToSixtySecs: 5.4,
    listingId: 88,
    listingYear: 2021,
    listingCoinPrice: 260,
  },
};

describe("ReviewDetailPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    clearCompareSelection();
  });

  beforeEach(() => {
    clearCompareSelection();
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "member@example.com",
        displayName: "Member",
        bio: null,
        role: "member",
        coinBalance: 100,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 100,
      },
    });
    vi.mocked(api.fetchReview).mockResolvedValue({ review: { ...publishedReview } });
    vi.mocked(api.likeReview).mockResolvedValue({ ok: true, liked: true, likeCount: 1 });
    vi.mocked(api.unlikeReview).mockResolvedValue({ ok: true, liked: false, likeCount: 0 });
    vi.mocked(api.featureReview).mockResolvedValue({
      ok: true,
      review: { ...publishedReview, featured: true },
    });
    vi.mocked(api.unfeatureReview).mockResolvedValue({
      ok: true,
      review: { ...publishedReview, featured: false },
    });
  });

  it("shows bay hierarchy, car media, cue cards, and like controls", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay burn — Focus ST" })).toBeInTheDocument();
    expect(screen.getByText(/Video review · Midnight garage/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Review status")).toBeInTheDocument();
    const hero = screen.getByLabelText("Bay car photo");
    expect(hero.className).toMatch(/listing-hero-motion/);
    expect(hero.querySelector('[data-bay-frame="hero"]')).not.toBeNull();
    const heroImg = hero.querySelector("img");
    expect(heroImg).not.toBeNull();
    expect(heroImg?.getAttribute("src") ?? "").toMatch(/data:image\/svg\+xml/);
    expect(screen.getByRole("heading", { name: "Cue cards" })).toBeInTheDocument();
    expect(screen.getByLabelText("Review actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open car Ford Focus" })).toHaveAttribute(
      "href",
      "/cars/143",
    );
    expect(screen.getByRole("button", { name: "Compare Ford Focus" })).toBeInTheDocument();
    expect(screen.getByText("0 likes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Like" }));

    await waitFor(() => {
      expect(api.likeReview).toHaveBeenCalledWith(9);
      expect(screen.getByText("1 like")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Liked" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("copies the absolute review URL with a success toast", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Copy link" }));
    expect(copyTextToClipboard).toHaveBeenCalled();
    const copied = vi.mocked(copyTextToClipboard).mock.calls[0]?.[0] ?? "";
    expect(copied).toMatch(/\/reviews\/9$/);
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
    // Cue cards / playback stay available beside Copy link.
    expect(screen.getByRole("heading", { name: "Cue cards" })).toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeNull();
  });

  it("shows dual lane cars for a drag race", async () => {
    vi.mocked(api.fetchReview).mockResolvedValue({ review: { ...dragRaceReview } });
    render(
      <MemoryRouter initialEntries={["/reviews/12"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Bay drag — ST vs Type R" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Drag race · Midnight garage/i)).toBeInTheDocument();
    const hero = screen.getByLabelText("Lane cars bay photo");
    expect(hero.className).toMatch(/listing-hero-motion/);
    expect(hero.querySelectorAll('[data-bay-frame="hero"]').length).toBe(2);
    expect(screen.getByLabelText("Review status")).toHaveTextContent(/Drag race/i);
    expect(screen.getByRole("link", { name: "Open car Ford Focus" })).toHaveAttribute(
      "href",
      "/cars/143",
    );
    expect(screen.getByRole("link", { name: "Open car Honda Civic" })).toHaveAttribute(
      "href",
      "/cars/88",
    );
    expect(screen.getByRole("button", { name: "Compare Ford Focus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare Honda Civic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("queues Compare into the shared tray from detail", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Compare Ford Focus" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Compare Ford Focus" }));
    expect(screen.getByLabelText("Compare selection")).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1\/2\)/i)).toBeInTheDocument();
    expect(loadCompareSelection()[0]?.id).toBe(143);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open car Ford Focus" })).toBeInTheDocument();
  });

  it("hides Open car and Compare on detail when no related listing is known", async () => {
    vi.mocked(api.fetchReview).mockResolvedValue({
      review: {
        ...publishedReview,
        car: {
          ...publishedReview.car,
          listingId: null,
          listingYear: null,
          listingCoinPrice: null,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay burn — Focus ST" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open car/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Compare/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("lets an admin pin and unpin a featured review", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 1,
        email: "brad@example.com",
        displayName: "Brad",
        bio: null,
        role: "admin",
        coinBalance: 900,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 900,
      },
    });

    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Admin review controls")).toBeInTheDocument();
    const pin = screen.getByRole("button", { name: "Pin as featured on home" });
    await user.click(pin);
    await waitFor(() => {
      expect(api.featureReview).toHaveBeenCalledWith(9);
      expect(screen.getByRole("button", { name: "Unpin from home" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });
});
