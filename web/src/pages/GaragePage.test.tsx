import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { GaragePage } from "./GaragePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchGarage: vi.fn(),
  fetchWallet: vi.fn(),
  fetchSoldHistory: vi.fn(),
  fetchPurchaseHistory: vi.fn(),
}));

import * as api from "../api";

describe("GaragePage media cards", () => {
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
        coinBalance: 500,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 500,
      },
    });
    vi.mocked(api.fetchWallet).mockResolvedValue({ balance: 500, ledger: [] });
    vi.mocked(api.fetchSoldHistory).mockResolvedValue({ sales: [] });
    vi.mocked(api.fetchPurchaseHistory).mockResolvedValue({ purchases: [] });
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
  });

  it("renders owned cars as photo-first media cards", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <GaragePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "My cars" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
