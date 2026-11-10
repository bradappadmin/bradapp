import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { MatchHistoryPage } from "./MatchHistoryPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchTopTrumpsHistory: vi.fn(),
}));

import * as api from "../api";

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

    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("Loss")).toBeInTheDocument();
    expect(screen.getByText(/vs House/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Sam Bay/i)).toBeInTheDocument();

    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    expect(screen.getByRole("link", { name: /Back to Play/i })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );
  });
});
