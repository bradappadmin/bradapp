import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
import { AdminHomePage } from "./AdminHomePage";

vi.mock("../../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchAdminStats: vi.fn(),
}));

import * as api from "../../api";

describe("AdminHomePage quick stats", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 1,
        email: "bradapp.admin@gmail.com",
        displayName: "Brad",
        bio: null,
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
    vi.mocked(api.fetchAdminStats).mockResolvedValue({
      stats: {
        memberAccounts: 12,
        frozenAccounts: 1,
        listingsForSale: 4,
        pendingTradeOffers: 2,
        publishedReviews: 7,
      },
    });
  });

  it("shows Midnight Garage quick-stat chips linking into admin sections", async () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <AdminHomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByText("Admin bay")).toBeInTheDocument();
    const stats = await screen.findByRole("region", { name: "Admin quick stats" });
    expect(stats).toHaveTextContent("Bay snapshot");
    expect(stats).toHaveTextContent("12");
    expect(stats).toHaveTextContent("Member accounts");
    expect(stats).toHaveTextContent("Frozen accounts");
    expect(stats).toHaveTextContent("Listings for sale");
    expect(stats).toHaveTextContent("Pending trades");
    expect(stats).toHaveTextContent("Published reviews");

    expect(screen.getByRole("link", { name: /Member accounts/i })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: /Frozen accounts/i })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: /Listings for sale/i })).toHaveAttribute(
      "href",
      "/admin/inventory",
    );
    expect(screen.getByRole("link", { name: /Pending trades/i })).toHaveAttribute(
      "href",
      "/trades",
    );
    expect(screen.getByRole("link", { name: /Published reviews/i })).toHaveAttribute(
      "href",
      "/reviews",
    );
  });
});
