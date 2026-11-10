import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
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

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="reviews-params">{params.toString()}</div>;
}

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

const memberUser = {
  id: 2,
  email: "member@example.com",
  displayName: "Member",
  bio: null,
  role: "member" as const,
  coinBalance: 200,
};

const adminUser = {
  id: 1,
  email: "bradapp.admin@gmail.com",
  displayName: "Brad",
  bio: null,
  role: "admin" as const,
  coinBalance: 500,
};

const dailyLogin = {
  amount: 25,
  claimDate: "2026-11-09",
  claimedToday: true,
  claimedJustNow: false,
  balance: 200,
};

describe("ReviewsPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: memberUser,
      dailyLogin,
    });
    vi.mocked(api.fetchReviews).mockImplementation(async (_all, _limit, type) => {
      if (type === "drag_race") return { reviews: [dragRace] };
      if (type === "review") return { reviews: [cueCard] };
      return { reviews: [cueCard, dragRace] };
    });
  });

  it("shows bay hierarchy and keeps type filter chips", async () => {
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
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Find a review" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Record a review" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();
    expect(screen.getByText("Bay drag")).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Oldest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Title A–Z" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Title Z–A" })).toBeInTheDocument();

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

  it("sorts by title via Sort the bay and persists sort in the URL", async () => {
    const user = userEvent.setup();
    const older = {
      ...cueCard,
      id: 3,
      title: "Alpha bay",
      createdAt: "2026-11-07T12:00:00.000Z",
    };
    vi.mocked(api.fetchReviews).mockResolvedValue({
      reviews: [cueCard, dragRace, older],
    });

    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/reviews"
              element={
                <>
                  <ReviewsPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();
    const sort = screen.getByRole("combobox", { name: "Sort reviews" });
    expect(sort).toHaveValue("newest");

    await user.selectOptions(sort, "title_asc");
    await waitFor(() => {
      expect(screen.getByTestId("reviews-params").textContent).toContain("sort=title_asc");
    });
    expect(sort).toHaveValue("title_asc");

    const titles = screen.getAllByRole("link").map((a) => a.textContent ?? "");
    const alpha = titles.findIndex((t) => /Alpha bay/i.test(t));
    const bayCue = titles.findIndex((t) => /Bay cue card/i.test(t));
    const bayDrag = titles.findIndex((t) => /Bay drag/i.test(t));
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(bayCue).toBeGreaterThan(alpha);
    expect(bayDrag).toBeGreaterThan(bayCue);
  });

  it("searches by make/model/title and keeps type in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/reviews"
              element={
                <>
                  <ReviewsPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search reviews by make, model, or title/i,
    });
    await user.clear(input);
    await user.type(input, "mustang");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("reviews-params").textContent).toContain("q=mustang");
    });
    expect(screen.getByText("Bay drag")).toBeInTheDocument();
    expect(screen.queryByText("Bay cue card")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => {
      expect(screen.getByTestId("reviews-params").textContent).not.toContain("q=");
    });
    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();

    await user.type(input, "porsche");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(screen.getByTestId("reviews-params").textContent).toContain("q=porsche");
    });
    await user.click(screen.getByRole("button", { name: "Cue card" }));
    await waitFor(() => {
      const text = screen.getByTestId("reviews-params").textContent ?? "";
      expect(text).toContain("q=porsche");
      expect(text).toContain("type=review");
    });
    expect(await screen.findByText("Bay cue card")).toBeInTheDocument();
    expect(screen.queryByText("Bay drag")).not.toBeInTheDocument();

    const sort = screen.getByRole("combobox", { name: "Sort reviews" });
    await user.selectOptions(sort, "oldest");
    await waitFor(() => {
      const text = screen.getByTestId("reviews-params").textContent ?? "";
      expect(text).toContain("q=porsche");
      expect(text).toContain("type=review");
      expect(text).toContain("sort=oldest");
    });
  });

  it("shows empty filter state for unmatched search", async () => {
    render(
      <MemoryRouter initialEntries={["/reviews?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews" element={<ReviewsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching reviews")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("heading", { name: "Find a review" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  it("shows empty bay CTAs when the reel has no reviews", async () => {
    vi.mocked(api.fetchReviews).mockResolvedValue({ reviews: [] });

    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews" element={<ReviewsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empty bay")).toBeInTheDocument();
    const empty = screen.getByLabelText("Empty reviews bay");
    expect(empty.querySelector('a[href="/cars"]')?.textContent).toMatch(/Browse cars/);
    expect(screen.queryByRole("heading", { name: "Find a review" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sort the bay")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("keeps Find chips and Clear filters when a type filter yields none", async () => {
    vi.mocked(api.fetchReviews).mockImplementation(async (_all, _limit, type) => {
      if (type === "drag_race") return { reviews: [] };
      return { reviews: [cueCard] };
    });

    render(
      <MemoryRouter initialEntries={["/reviews?type=drag_race"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews" element={<ReviewsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByText(/No drag races in this filter/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
  });

  it("shows a clearer Record CTA for admins", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: adminUser,
      dailyLogin: { ...dailyLogin, balance: 500 },
    });

    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <AuthProvider>
          <Routes>
            <Route path="/reviews" element={<ReviewsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const record = await screen.findByRole("link", { name: "Record a review" });
    expect(record).toHaveAttribute("href", "/reviews/record");
    expect(screen.getByText(/Admin bay/i)).toBeInTheDocument();
    expect(api.fetchReviews).toHaveBeenCalledWith(true, undefined, "all");
  });
});
