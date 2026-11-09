import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { TradesPage } from "./TradesPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchGarage: vi.fn(),
  fetchMembers: vi.fn(),
  fetchTrades: vi.fn(),
  fetchMemberCards: vi.fn(),
}));

import * as api from "../api";

describe("TradesPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 420,
      cars: [
        {
          id: 9,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          conditionType: "used",
          year: 2022,
          colour: "Racing Red",
          mileage: 12000,
          coinPrice: 420,
          status: "owned",
          ownerLabel: "You",
          garageName: "Bay",
          garageCity: "London",
        },
      ],
    });
    vi.mocked(api.fetchMembers).mockResolvedValue({
      members: [
        {
          id: 177,
          displayName: "Sam Bay",
          bio: null,
          role: "member",
          roleLabel: "Member",
          carCount: 2,
          coinBalance: 300,
        },
      ],
    });
    vi.mocked(api.fetchTrades).mockResolvedValue({ trades: [] });
    vi.mocked(api.fetchMemberCards).mockResolvedValue({ cards: [] });
  });

  it("shows bay hierarchy, inbox, compose, and history entry", async () => {
    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Card trades" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(screen.getByText(/Free swaps/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send a free trade" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your outgoing offers" })).toBeInTheDocument();

    const history = screen.getAllByRole("link", { name: /Completed history|Full history/i });
    expect(history.some((link) => link.getAttribute("href") === "/trades/history")).toBe(true);

    expect(await screen.findByRole("button", { name: /Send free trade offer/i })).toBeInTheDocument();
  });

  it("honours offer-trade deeplink query params in compose", async () => {
    vi.mocked(api.fetchMemberCards).mockResolvedValue({
      cards: [
        {
          id: 143,
          ownerUserId: 177,
          ownerDisplayName: "Sam Bay",
          make: "Bugatti",
          model: "Chiron",
          trimName: "Sport",
          bodyType: "Coupe",
          colour: "Arctic White",
          year: 2021,
          bhp: 1479,
          topSpeedMph: 261,
          zeroToSixtySecs: 2.3,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades?with=177&theirCar=143"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Send a free trade" })).toBeInTheDocument();
    const memberSelect = await screen.findByLabelText(/^Member$/i);
    expect(memberSelect).toHaveValue("177");
    expect(await screen.findByLabelText(/You request/i)).toHaveValue("143");
  });
});
