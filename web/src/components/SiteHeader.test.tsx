import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("SiteHeader", () => {
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

    expect(await screen.findByRole("link", { name: "BradApp" })).toBeInTheDocument();
    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).not.toBeInTheDocument();

    await user.click(openButton);
    const mobileNav = screen.getByRole("navigation", { name: "Primary mobile" });
    expect(mobileNav).toBeInTheDocument();
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

  it("shows a pending inbox badge on Trades when signed in", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 7,
        email: "member@example.com",
        displayName: "Member",
        role: "member",
        coinBalance: 200,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 200,
      },
    });
    vi.mocked(api.fetchTradeInboxCount).mockResolvedValue({ pendingIncoming: 3 });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("3 pending trade offers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trades/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Favourites" }).length).toBeGreaterThan(0);
  });
});
