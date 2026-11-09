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

const favourite = {
  id: 11,
  make: "Audi",
  model: "RS6",
  trimName: "Avant",
  bodyType: "Estate",
  bhp: 591,
  topSpeedMph: 155,
  zeroToSixtySecs: 3.6,
  conditionType: "used" as const,
  year: 2019,
  colour: "Nardo Grey",
  mileage: 18000,
  coinPrice: 310,
  status: "available" as const,
  ownerLabel: "Bay stock",
  garageName: "Bay",
  garageCity: "London",
  favouritedAt: "2026-11-09T12:00:00.000Z",
};

describe("FavouritesPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchFavourites).mockResolvedValue({
      cars: [favourite],
    });
  });

  it("shows bay hierarchy and photo-first media cards", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <FavouritesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Favourites" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(await screen.findByRole("heading", { name: "Saved" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Audi RS6 Avant/i })).toHaveAttribute(
      "href",
      "/cars/11",
    );
    const browseLinks = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browseLinks.some((link) => link.getAttribute("href") === "/cars")).toBe(true);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("shows a clear empty state with Cars CTA", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [] });

    render(
      <MemoryRouter>
        <AuthProvider>
          <FavouritesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No favourites yet")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    const cta = screen.getAllByRole("link", { name: "Browse cars" });
    expect(cta.some((link) => link.className.includes("bay-cta"))).toBe(true);
    expect(screen.queryByRole("heading", { name: "Saved" })).not.toBeInTheDocument();
  });
});
