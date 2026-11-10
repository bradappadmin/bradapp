import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { LedgerPage } from "./LedgerPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchLedger: vi.fn(),
}));

import * as api from "../api";

describe("LedgerPage Midnight Garage UI", () => {
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
        coinBalance: 540,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 540,
      },
    });
    vi.mocked(api.fetchLedger).mockResolvedValue({
      balance: 540,
      ledger: [
        {
          id: 3,
          delta: 15,
          balanceAfter: 540,
          reason: "tt_streak_bonus",
          listingId: null,
          note: "3-win streak bonus",
          createdAt: "2026-11-09T18:00:00.000Z",
        },
        {
          id: 2,
          delta: 25,
          balanceAfter: 525,
          reason: "daily_login",
          listingId: null,
          note: "Daily login",
          createdAt: "2026-11-09T12:00:00.000Z",
        },
        {
          id: 1,
          delta: -40,
          balanceAfter: 500,
          reason: "purchase",
          listingId: 9,
          note: "Bought listing #9",
          createdAt: "2026-11-08T10:00:00.000Z",
        },
      ],
    });
  });

  it("shows bay hierarchy, balance panel, and labelled ledger rows", async () => {
    render(
      <MemoryRouter initialEntries={["/ledger"]}>
        <AuthProvider>
          <LedgerPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Coin ledger" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(await screen.findByLabelText("Ledger bay notes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(screen.getByLabelText("Brad Coin ledger entries")).toBeInTheDocument();

    expect(await screen.findByText("Win streak")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Listing #9" })).toHaveAttribute("href", "/cars/9");
    expect(
      screen.getAllByRole("link", { name: "Account" }).some((l) => l.getAttribute("href") === "/account"),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: "My cars" }).some((l) => l.getAttribute("href") === "/garage"),
    ).toBe(true);
  });

  it("shows a clear empty ledger state", async () => {
    vi.mocked(api.fetchLedger).mockResolvedValue({ balance: 100, ledger: [] });

    render(
      <MemoryRouter initialEntries={["/ledger"]}>
        <AuthProvider>
          <LedgerPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No ledger rows yet")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.queryByRole("heading", { name: "History" })).not.toBeInTheDocument();
  });
});
