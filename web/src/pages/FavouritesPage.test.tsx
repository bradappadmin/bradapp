import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { FavouritesPage } from "./FavouritesPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavourites: vi.fn(),
}));

import * as api from "../api";

describe("FavouritesPage media cards", () => {
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
    vi.mocked(api.fetchFavourites).mockResolvedValue({
      cars: [
        {
          id: 11,
          make: "Audi",
          model: "RS6",
          trimName: "Avant",
          bodyType: "Estate",
          bhp: 591,
          topSpeedMph: 155,
          zeroToSixtySecs: 3.6,
          conditionType: "used",
          year: 2019,
          colour: "Nardo Grey",
          mileage: 18000,
          coinPrice: 310,
          status: "available",
          ownerLabel: "Bay stock",
          garageName: "Bay",
          garageCity: "London",
          favouritedAt: "2026-11-09T12:00:00.000Z",
        },
      ],
    });
  });

  it("renders favourites as photo-first media cards", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <FavouritesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Favourites" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Audi RS6 Avant/i })).toHaveAttribute(
      "href",
      "/cars/11",
    );
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
