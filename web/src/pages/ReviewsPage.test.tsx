import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ReviewsPage } from "./ReviewsPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchReviews: vi.fn(),
  fetchFeaturedReview: vi.fn().mockResolvedValue({ review: null }),
}));

import * as api from "../api";

const cueCard = {
  id: 1,
  type: "review" as const,
  title: "Bay cue card",
  status: "published" as const,
  createdAt: "2026-11-09T12:00:00.000Z",
  publisher: { id: 1, displayName: "Brad" },
  car: {
    id: 10,
    make: "Porsche",
    model: "911",
    trimName: "GT3",
    bodyType: "Coupe",
    colour: "Midnight Black",
    bhp: 502,
    topSpeedMph: 197,
    zeroToSixtySecs: 3.2,
  },
  carB: null,
  cueCards: [],
  videoUrl: "/reviews/1/video",
  mimeType: "video/webm",
  likeCount: 0,
  likedByMe: false,
  featured: false,
};

const dragRace = {
  ...cueCard,
  id: 2,
  type: "drag_race" as const,
  title: "Bay drag",
  carB: {
    id: 11,
    make: "Ford",
    model: "Mustang",
    trimName: "GT",
    bodyType: "Coupe",
    colour: "Midnight Black",
    bhp: 450,
    topSpeedMph: 155,
    zeroToSixtySecs: 4.2,
  },
  videoUrl: "/reviews/2/video",
};

describe("ReviewsPage type filters", () => {
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
        coinBalance: 200,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 200,
      },
    });
    vi.mocked(api.fetchReviews).mockImplementation(async (_all, _limit, type) => {
      if (type === "drag_race") return { reviews: [dragRace] };
      if (type === "review") return { reviews: [cueCard] };
      return { reviews: [cueCard, dragRace] };
    });
  });

  it("filters the list with All / Cue card / Drag race chips", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews" element={<ReviewsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Video reviews" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();
    expect(screen.getByText("Bay drag")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Drag race" }));
    expect(await screen.findByRole("button", { name: "Drag race" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(api.fetchReviews).toHaveBeenCalledWith(false, undefined, "drag_race");
    expect(await screen.findByText("Bay drag")).toBeInTheDocument();
    expect(screen.queryByText("Bay cue card")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cue card" }));
    expect(api.fetchReviews).toHaveBeenCalledWith(false, undefined, "review");
    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();
    expect(screen.queryByText("Bay drag")).not.toBeInTheDocument();
  });
});
