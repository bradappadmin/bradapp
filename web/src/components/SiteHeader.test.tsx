import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { SiteHeader } from "./SiteHeader";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
  fetchTradeInboxCount: vi.fn(),
}));

import * as api from "../api";

const member = {
  user: {
    id: 7,
    email: "member@example.com",
    displayName: "Member",
    bio: null,
    role: "member" as const,
    coinBalance: 200,
  },
  dailyLogin: {
    amount: 25,
    claimDate: "2026-11-09",
    claimedToday: true,
    claimedJustNow: false,
    balance: 200,
  },
};

describe("SiteHeader", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(api.fetchTradeInboxCount).mockResolvedValue({ pendingIncoming: 0 });
  });

  it("toggles the mobile menu and shows primary links when open", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    const brand = await screen.findByRole("link", { name: "BradApp" });
    expect(brand).toBeInTheDocument();
    expect(document.querySelector("header.nav-shell")).not.toBeNull();
    expect(document.querySelector(".bay-brand-line")).not.toBeNull();

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).not.toBeInTheDocument();

    await user.click(openButton);
    const mobileNav = screen.getByRole("navigation", { name: "Primary mobile" });
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav).toHaveClass("nav-shell-panel");
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(mobileNav).toHaveTextContent("Cars");
    expect(mobileNav).toHaveTextContent("Compare");
    expect(mobileNav).toHaveTextContent("Play");
    expect(mobileNav).toHaveTextContent("How to");
    expect(mobileNav).toHaveTextContent("Members");
    expect(mobileNav).toHaveTextContent("Sign in");

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).not.toBeInTheDocument();
  });

  it("hides the Trades inbox badge when pending count is zero", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(member);
    vi.mocked(api.fetchTradeInboxCount).mockResolvedValue({ pendingIncoming: 0 });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /^Trades$/i })).toBeInTheDocument();
    expect(screen.queryByTestId("trades-inbox-badge")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pending trade offer/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("trades-inbox-menu-dot")).not.toBeInTheDocument();
  });

  it("shows a pending inbox badge on Trades when signed in", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(member);
    vi.mocked(api.fetchTradeInboxCount).mockResolvedValue({ pendingIncoming: 3 });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("3 pending trade offers")).toBeInTheDocument();
    const badge = screen.getAllByTestId("trades-inbox-badge")[0]!;
    expect(badge).toHaveTextContent("3");
    expect(badge.className).toMatch(/bg-rose/);
    expect(badge.className).toMatch(/ring-lime/);
    expect(screen.getAllByRole("link", { name: /Trades/i }).length).toBeGreaterThan(0);
    expect(screen.getByTestId("trades-inbox-menu-dot")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open menu, 3 pending trade offers/i }),
    ).toBeInTheDocument();
  });

  it("caps the badge label at 9+", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(member);
    vi.mocked(api.fetchTradeInboxCount).mockResolvedValue({ pendingIncoming: 12 });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("12 pending trade offers")).toBeInTheDocument();
    expect(screen.getAllByTestId("trades-inbox-badge")[0]).toHaveTextContent("9+");
  });
});
