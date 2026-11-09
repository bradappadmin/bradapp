import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { RECENTLY_VIEWED_KEY } from "../recently-viewed";
import { HomePage } from "./HomePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchActivity: vi.fn().mockResolvedValue({ items: [] }),
}));

import * as api from "../api";

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    window.localStorage.clear();
  });

  it("shows recently viewed cars from localStorage on home", async () => {
    window.localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify([
        {
          id: 42,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          colour: "Racing Red",
          year: 2022,
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          coinPrice: 420,
          status: "available",
          viewedAt: Date.now(),
        },
      ]),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Recently viewed cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently viewed" })).toBeInTheDocument();
    expect(screen.getByText(/Porsche 911 GT3/i)).toBeInTheDocument();
  });

  it("shows BradApp brand and auth links when signed out", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("BradApp")).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Cars" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "How to" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Play" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Reviews" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("region", { name: "First visit tips" })).not.toBeInTheDocument();
  });

  it("shows dismissible first-visit tips after sign-in, including Admin for admins", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 3,
        email: "bradapp.admin@gmail.com",
        displayName: "Brad",
        role: "admin",
        coinBalance: 1000,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 1000,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const tips = await screen.findByRole("region", { name: "First visit tips" });
    expect(screen.getByRole("heading", { name: "Quick tips" })).toBeInTheDocument();
    expect(tips).toHaveTextContent("Cars");
    expect(tips).toHaveTextContent("Play");
    expect(tips).toHaveTextContent("Trades");
    expect(tips).toHaveTextContent("Reviews");
    expect(tips).toHaveTextContent("Admin");
  });
});
