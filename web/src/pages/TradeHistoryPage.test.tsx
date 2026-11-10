import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { TradeHistoryPage } from "./TradeHistoryPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchCompletedTrades: vi.fn(),
}));

import * as api from "../api";

describe("TradeHistoryPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchCompletedTrades).mockResolvedValue({
      trades: [
        {
          id: 5,
          resolvedAt: "2026-11-09T20:00:00.000Z",
          counterpartyName: "Sam Bay",
          counterpartyUserId: 177,
          theirCarListingId: 42,
          theirCarAvailable: true,
          youWere: "offerer",
          youGave: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
          },
          youGot: {
            listingId: 9,
            make: "BMW",
            model: "M3",
            trimName: "Competition",
          },
        },
        {
          id: 4,
          resolvedAt: "2026-11-08T18:00:00.000Z",
          counterpartyName: "Casey Apex",
          counterpartyUserId: 88,
          theirCarListingId: 11,
          theirCarAvailable: false,
          youWere: "receiver",
          youGave: {
            listingId: 11,
            make: "Audi",
            model: "RS6",
            trimName: "Avant",
          },
          youGot: {
            listingId: 15,
            make: "Ford",
            model: "Mustang",
            trimName: "GT",
          },
        },
      ],
    });
  });

  it("shows bay hierarchy, Trade again deep-links, and disabled when car is gone", async () => {
    render(
      <MemoryRouter initialEntries={["/trades/history"]}>
        <AuthProvider>
          <TradeHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Completed trades" })).toBeInTheDocument();
    expect(screen.getByText(/Free card trades · Midnight garage/i)).toBeInTheDocument();
    expect(await screen.findByLabelText("Completed trade summary")).toHaveTextContent(
      /2 completed/i,
    );
    expect(screen.getByLabelText("Completed trade summary")).toHaveTextContent(
      /1 offered · 1 accepted/i,
    );

    expect(screen.getByText(/with Sam Bay/i)).toBeInTheDocument();
    expect(screen.getByText(/You offered/i)).toBeInTheDocument();
    expect(screen.getByText(/You accepted/i)).toBeInTheDocument();
    expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(1);

    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    expect(screen.getByRole("link", { name: /Back to Trades/i })).toHaveAttribute(
      "href",
      "/trades",
    );
    expect(screen.getByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );

    expect(screen.getByRole("link", { name: "Trade again" })).toHaveAttribute(
      "href",
      "/trades?with=177&theirCar=42",
    );
    const disabled = screen.getByRole("button", { name: "Trade again" });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute("title", "They no longer have that car");
  });
});
