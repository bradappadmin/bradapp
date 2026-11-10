import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { LedgerPage } from "./LedgerPage";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="ledger-params">{params.toString()}</div>;
}

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
          id: 4,
          delta: 25,
          balanceAfter: 540,
          reason: "play_reward",
          listingId: null,
          note: "Top Trumps play",
          createdAt: "2026-11-09T19:00:00.000Z",
        },
        {
          id: 3,
          delta: 15,
          balanceAfter: 515,
          reason: "tt_streak_bonus",
          listingId: null,
          note: "3-win streak bonus",
          createdAt: "2026-11-09T18:00:00.000Z",
        },
        {
          id: 2,
          delta: 25,
          balanceAfter: 500,
          reason: "daily_login",
          listingId: null,
          note: "Daily login",
          createdAt: "2026-11-09T12:00:00.000Z",
        },
        {
          id: 1,
          delta: -40,
          balanceAfter: 475,
          reason: "purchase",
          listingId: 9,
          note: "Bought listing #9",
          createdAt: "2026-11-08T10:00:00.000Z",
        },
      ],
    });
  });

  it("shows bay hierarchy, balance panel, find search, filter chips, and labelled ledger rows", async () => {
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
    expect(screen.getByRole("heading", { name: "Find an entry" })).toBeInTheDocument();
    expect(screen.getByLabelText("Filter ledger by reason")).toBeInTheDocument();
    expect(screen.getByLabelText("Brad Coin ledger entries")).toBeInTheDocument();

    const entries = await screen.findByLabelText("Brad Coin ledger entries");
    expect(entries).toHaveTextContent("Play");
    expect(entries).toHaveTextContent("Win streak");
    expect(entries).toHaveTextContent("Daily");
    expect(entries).toHaveTextContent("Buy");
    expect(screen.getByRole("link", { name: "Listing #9" })).toHaveAttribute("href", "/cars/9");
    expect(
      screen.getAllByRole("link", { name: "Account" }).some((l) => l.getAttribute("href") === "/account"),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: "My cars" }).some((l) => l.getAttribute("href") === "/garage"),
    ).toBe(true);
  });

  it("filters history by reason group via chips and URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/ledger"]}>
        <AuthProvider>
          <LedgerPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Brad Coin ledger entries")).toHaveTextContent("Buy");
    await user.click(screen.getByRole("button", { name: "Buys/Sells" }));
    expect(screen.getByRole("button", { name: "Buys/Sells" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const tradesOnly = screen.getByLabelText("Brad Coin ledger entries");
    expect(tradesOnly).toHaveTextContent("Buy");
    expect(tradesOnly).not.toHaveTextContent("Win streak");
    expect(tradesOnly).not.toHaveTextContent("Daily");
    expect(screen.getAllByText(/1 of 4 rows/i).length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole("button", { name: "Bonuses" }));
    const bonusesOnly = screen.getByLabelText("Brad Coin ledger entries");
    expect(bonusesOnly).toHaveTextContent("Win streak");
    expect(bonusesOnly).toHaveTextContent("Daily");
    expect(bonusesOnly).not.toHaveTextContent("Buy");

    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching ledger entries")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(clearButtons[clearButtons.length - 1]!);
    expect(screen.getByLabelText("Brad Coin ledger entries")).toHaveTextContent("Buy");
  });

  it("honours an initial group query param", async () => {
    render(
      <MemoryRouter initialEntries={["/ledger?group=play"]}>
        <AuthProvider>
          <LedgerPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const entries = screen.getByLabelText("Brad Coin ledger entries");
    expect(entries).toHaveTextContent("Top Trumps play");
    expect(entries).not.toHaveTextContent("Buy");
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

  it("searches ledger by reason/note and keeps group in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/ledger"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/ledger"
              element={
                <>
                  <LedgerPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find an entry" })).toBeInTheDocument();
    const input = screen.getByRole("searchbox", {
      name: /Search ledger by reason or note/i,
    });
    await user.clear(input);
    await user.type(input, "streak");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("ledger-params").textContent).toContain("q=streak");
    });
    const entries = screen.getByLabelText("Brad Coin ledger entries");
    expect(entries).toHaveTextContent("Win streak");
    expect(entries).not.toHaveTextContent("Buy");
    expect(entries).not.toHaveTextContent("Daily");

    await user.click(screen.getByRole("button", { name: "Bonuses" }));
    await waitFor(() => {
      const text = screen.getByTestId("ledger-params").textContent ?? "";
      expect(text).toContain("q=streak");
      expect(text).toContain("group=bonuses");
    });
    expect(screen.getByLabelText("Brad Coin ledger entries")).toHaveTextContent("Win streak");
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/ledger?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/ledger"
              element={
                <>
                  <LedgerPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching ledger entries")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find an entry" })).toBeInTheDocument();
    expect(screen.getByLabelText("Filter ledger by reason")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("ledger-params").textContent).toBe("");
    });
    expect(screen.getByLabelText("Brad Coin ledger entries")).toHaveTextContent("Buy");
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });

  it("keeps empty ledger Browse cars when truly empty even with Find", async () => {
    vi.mocked(api.fetchLedger).mockResolvedValue({ balance: 100, ledger: [] });

    render(
      <MemoryRouter initialEntries={["/ledger?q=zzzz"]}>
        <AuthProvider>
          <LedgerPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No ledger rows yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });
});
