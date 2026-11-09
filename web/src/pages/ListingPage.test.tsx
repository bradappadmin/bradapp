import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import type { ListingDetail } from "../cars";
import { ToastProvider } from "../toast-context";
import { ListingPage } from "./ListingPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchListing: vi.fn(),
}));

import * as api from "../api";

const memberOwnedListing: ListingDetail = {
  id: 143,
  make: "Bugatti",
  model: "Chiron",
  trimName: "Sport",
  bodyType: "Coupe",
  fuel: "Petrol",
  drivetrain: "AWD",
  bhp: 1479,
  topSpeedMph: 261,
  zeroToSixtySecs: 2.3,
  conditionType: "used",
  year: 2021,
  colour: "Arctic White",
  mileage: 138900,
  coinPrice: 549,
  ownerLabel: "Sam Bay",
  ownerUserId: 177,
  status: "available",
  garageName: "Thames Valley Stock",
  garageCity: "Reading",
  doors: 2,
  seats: 2,
  garageTagline: "Commuters and hot hatches.",
};

describe("ListingPage challenge CTA", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchListing).mockResolvedValue({
      listing: memberOwnedListing,
      favourited: false,
    });
  });

  it("shows Challenge to Top Trumps for another member’s listing when signed in", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
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

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const challenge = await screen.findByRole("link", { name: "Challenge to Top Trumps" });
    expect(challenge).toHaveAttribute("href", "/play?opponent=177&theirCar=143");
    const trade = screen.getByRole("link", { name: "Offer trade" });
    expect(trade).toHaveAttribute("href", "/trades?with=177&theirCar=143");
  });

  it("prompts sign-in to challenge or trade when signed out", async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));

    render(
      <MemoryRouter initialEntries={["/cars/143"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/cars/:id" element={<ListingPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: "Sign in to challenge or trade" }),
    ).toHaveAttribute("href", "/signin");
    expect(screen.queryByRole("link", { name: "Challenge to Top Trumps" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Offer trade" })).not.toBeInTheDocument();
  });
});
