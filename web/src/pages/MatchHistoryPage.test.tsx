import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { MatchHistoryPage } from "./MatchHistoryPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchTopTrumpsHistory: vi.fn(),
}));

import * as api from "../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="play-history-params">{params.toString()}</div>;
}

describe("MatchHistoryPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchTopTrumpsHistory).mockResolvedValue({
      matches: [
        {
          id: 11,
          mode: "house",
          category: "bhp",
          createdAt: "2026-11-09T20:00:00.000Z",
          opponentName: "House",
          opponentUserId: null,
          yourCar: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
            value: 500,
          },
          theirCar: {
            listingId: null,
            make: "Ferrari",
            model: "488",
            trimName: "",
            value: 480,
          },
          result: "win",
          coinReward: 25,
          youWere: "challenger",
        },
        {
          id: 10,
          mode: "pvp",
          category: "top_speed_mph",
          createdAt: "2026-11-08T18:00:00.000Z",
          opponentName: "Sam Bay",
          opponentUserId: 177,
          yourCar: {
            listingId: 7,
            make: "Audi",
            model: "RS6",
            trimName: "Avant",
            value: 420,
          },
          theirCar: {
            listingId: 9,
            make: "BMW",
            model: "M3",
            trimName: "Competition",
            value: 450,
          },
          result: "loss",
          coinReward: 5,
          youWere: "challenger",
        },
      ],
    });
  });

  it("shows bay hierarchy, win/loss badges, studio thumbs, and play CTA", async () => {
    render(
      <MemoryRouter initialEntries={["/play/history"]}>
        <AuthProvider>
          <MatchHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Match history" })).toBeInTheDocument();
    expect(screen.getByText(/Top Trumps · Midnight garage/i)).toBeInTheDocument();
    expect(await screen.findByLabelText("Match result summary")).toHaveTextContent(/1 win/i);
    expect(screen.getByLabelText("Match result summary")).toHaveTextContent(/1 loss/i);
    expect(screen.getByRole("heading", { name: "Filter results" })).toBeInTheDocument();

    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("Loss")).toBeInTheDocument();
    expect(screen.getByText("vs House")).toBeInTheDocument();
    expect(screen.getByText("vs Sam Bay")).toBeInTheDocument();

    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    expect(screen.getByRole("link", { name: /Back to Play/i })).toHaveAttribute("href", "/play");
    expect(
      screen.getAllByRole("link", { name: /Porsche 911 GT3/i }).every(
        (a) => a.getAttribute("href") === "/cars/42",
      ),
    ).toBe(true);

    expect(screen.getByRole("link", { name: "Open car Porsche 911 GT3" })).toHaveAttribute(
      "href",
      "/cars/42",
    );
    // House opponent card has no listing id — only your car gets Open car on that row.
    expect(screen.getByRole("link", { name: "Open car Audi RS6 Avant" })).toHaveAttribute(
      "href",
      "/cars/7",
    );
    expect(screen.getByRole("link", { name: "Open car BMW M3 Competition" })).toHaveAttribute(
      "href",
      "/cars/9",
    );

    expect(screen.queryByRole("link", { name: /Open opponent House/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open opponent Sam Bay" })).toHaveAttribute(
      "href",
      "/members/177",
    );

    expect(screen.getByRole("link", { name: "Rematch vs house" })).toHaveAttribute(
      "href",
      "/play",
    );
    expect(screen.getByRole("link", { name: "Rematch Sam Bay" })).toHaveAttribute(
      "href",
      "/play?opponent=177&theirCar=9",
    );
  });

  it("hides Open car when neither side has a listing id", async () => {
    vi.mocked(api.fetchTopTrumpsHistory).mockResolvedValue({
      matches: [
        {
          id: 30,
          mode: "house",
          category: "bhp",
          createdAt: "2026-11-09T12:00:00.000Z",
          opponentName: "House",
          opponentUserId: null,
          yourCar: {
            listingId: null,
            make: "Mystery",
            model: "Bay",
            trimName: "",
            value: 100,
          },
          theirCar: {
            listingId: null,
            make: "House",
            model: "Card",
            trimName: "",
            value: 90,
          },
          result: "win",
          coinReward: 25,
          youWere: "challenger",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/play/history"]}>
        <AuthProvider>
          <MatchHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("vs House")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open car/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rematch vs house" })).toHaveAttribute(
      "href",
      "/play",
    );
  });

  it("filters wins and losses with result chips in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/play/history"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/play/history"
              element={
                <>
                  <MatchHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("vs House")).toBeInTheDocument();
    expect(screen.getByText("vs Sam Bay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Wins" }));
    await waitFor(() => {
      expect(screen.getByTestId("play-history-params").textContent).toContain("result=wins");
    });
    expect(screen.getByRole("button", { name: "Wins" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("vs House")).toBeInTheDocument();
    expect(screen.queryByText("vs Sam Bay")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rematch vs house" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Losses" }));
    await waitFor(() => {
      expect(screen.getByTestId("play-history-params").textContent).toContain("result=losses");
    });
    expect(screen.getByText("vs Sam Bay")).toBeInTheDocument();
    expect(screen.queryByText("vs House")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rematch Sam Bay" })).toBeInTheDocument();
  });

  it("hides Rematch and Open opponent when the opponent is missing or is the viewer", async () => {
    vi.mocked(api.fetchTopTrumpsHistory).mockResolvedValue({
      matches: [
        {
          id: 20,
          mode: "pvp",
          category: "bhp",
          createdAt: "2026-11-09T12:00:00.000Z",
          opponentName: "Ghost",
          opponentUserId: null,
          yourCar: {
            listingId: 1,
            make: "Ford",
            model: "Focus",
            trimName: "ST",
            value: 200,
          },
          theirCar: {
            listingId: null,
            make: "BMW",
            model: "M2",
            trimName: "",
            value: 220,
          },
          result: "win",
          coinReward: 10,
          youWere: "challenger",
        },
        {
          id: 21,
          mode: "pvp",
          category: "top_speed_mph",
          createdAt: "2026-11-08T12:00:00.000Z",
          opponentName: "Member",
          opponentUserId: 2,
          yourCar: {
            listingId: 3,
            make: "Audi",
            model: "RS3",
            trimName: "",
            value: 300,
          },
          theirCar: {
            listingId: 4,
            make: "Mercedes",
            model: "A45",
            trimName: "",
            value: 310,
          },
          result: "loss",
          coinReward: 5,
          youWere: "challenger",
        },
        {
          id: 22,
          mode: "house",
          category: "zero_to_sixty_secs",
          createdAt: "2026-11-07T12:00:00.000Z",
          opponentName: "House",
          opponentUserId: null,
          yourCar: {
            listingId: 5,
            make: "Porsche",
            model: "Cayman",
            trimName: "GT4",
            value: 400,
          },
          theirCar: {
            listingId: null,
            make: "Ferrari",
            model: "488",
            trimName: "",
            value: 480,
          },
          result: "draw",
          coinReward: 8,
          youWere: "challenger",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/play/history"]}>
        <AuthProvider>
          <MatchHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("vs Ghost")).toBeInTheDocument();
    expect(screen.getByText("vs Member")).toBeInTheDocument();
    expect(screen.getByText("vs House")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Rematch Ghost/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Rematch Member/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open opponent/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rematch vs house" })).toHaveAttribute(
      "href",
      "/play",
    );
  });

  it("shows Empty bay and Play when there is no history", async () => {
    vi.mocked(api.fetchTopTrumpsHistory).mockResolvedValue({ matches: [] });

    render(
      <MemoryRouter initialEntries={["/play/history"]}>
        <AuthProvider>
          <MatchHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empty bay")).toBeInTheDocument();
    const empty = screen.getByLabelText("Empty match history bay");
    expect(empty).toBeInTheDocument();
    expect(empty.querySelector('a[href="/play"]')?.textContent).toMatch(/^Play$/);
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Filter results" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Rematch/i })).not.toBeInTheDocument();
  });

  it("shows No matches and Clear filter when Wins/Losses yields none", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTopTrumpsHistory).mockResolvedValue({
      matches: [
        {
          id: 11,
          mode: "house",
          category: "bhp",
          createdAt: "2026-11-09T20:00:00.000Z",
          opponentName: "House",
          opponentUserId: null,
          yourCar: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
            value: 500,
          },
          theirCar: {
            listingId: null,
            make: "Ferrari",
            model: "488",
            trimName: "",
            value: 480,
          },
          result: "win",
          coinReward: 25,
          youWere: "challenger",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/play/history?result=losses"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/play/history"
              element={
                <>
                  <MatchHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    const emptyFilter = screen.getByLabelText("No matching match history");
    expect(emptyFilter).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filter" })).toBeInTheDocument();
    expect(emptyFilter.querySelector('a[href="/play"]')?.textContent).toMatch(/^Play$/);
    expect(screen.queryByRole("link", { name: /Rematch/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    await waitFor(() => {
      expect(screen.getByTestId("play-history-params").textContent).toBe("");
    });
    expect(screen.getByText("vs House")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rematch vs house" })).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
