import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
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

import * as api from "../api";

const publishedReview = {
  id: 9,
  title: "Bay burn — Focus ST",
  status: "published" as const,
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
  cueCards: [{ id: "c1", title: "Look", prompt: "Walk around" }],
  videoUrl: "/reviews/9/video",
  mimeType: "video/webm",
  likeCount: 0,
  likedByMe: false,
  featured: false,
};

describe("ReviewDetailPage likes", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "member@example.com",
        displayName: "Member",
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

  it("lets a member like a published review and shows the count", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews/9"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay burn — Focus ST" })).toBeInTheDocument();
    expect(screen.getByText("0 likes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Like" }));

    await waitFor(() => {
      expect(api.likeReview).toHaveBeenCalledWith(9);
      expect(screen.getByText("1 like")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Liked" })).toHaveAttribute("aria-pressed", "true");
    });
  });
});
