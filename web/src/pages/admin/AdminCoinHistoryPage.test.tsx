import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
import { AdminCoinHistoryPage } from "./AdminCoinHistoryPage";

vi.mock("../../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchAdminUsers: vi.fn(),
  fetchAdminCoinAdjustments: vi.fn(),
  adjustAdminCoins: vi.fn(),
}));

import * as api from "../../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="admin-coins-params">{params.toString()}</div>;
}

const sam = {
  id: 10,
  email: "sam@example.com",
  displayName: "Sam Bay",
  role: "member" as const,
  coinBalance: 40,
  accountStatus: "active" as const,
};

const brad = {
  id: 1,
  email: "brad@example.com",
  displayName: "Brad",
  role: "admin" as const,
  coinBalance: 500,
  accountStatus: "active" as const,
};

describe("AdminCoinHistoryPage member search", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 1,
        email: "brad@example.com",
        displayName: "Brad",
        bio: null,
        role: "admin",
        coinBalance: 500,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-10",
        claimedToday: true,
        claimedJustNow: false,
        balance: 500,
      },
    });
    vi.mocked(api.fetchAdminUsers).mockResolvedValue({ users: [sam, brad] });
    vi.mocked(api.fetchAdminCoinAdjustments).mockResolvedValue({
      adjustments: [
        {
          id: 9,
          userId: 10,
          userDisplayName: "Sam Bay",
          userEmail: "sam@example.com",
          delta: 25,
          balanceAfter: 65,
          note: "Top-up",
          createdAt: "2026-11-09T12:00:00.000Z",
          createdByUserId: 1,
          createdByDisplayName: "Brad",
        },
      ],
    });
    vi.mocked(api.adjustAdminCoins).mockResolvedValue({
      balance: 65,
      ledger: [],
    });
  });

  it("searches members and filters low balance", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/coin-history"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/coin-history"
              element={
                <>
                  <AdminCoinHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Coin adjustments" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Adjust balance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent adjustments" })).toBeInTheDocument();
    expect(screen.getByText("Top-up")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search members by display name or email/i,
    });
    await user.clear(input);
    await user.type(input, "sam");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-coins-params").textContent).toContain("q=sam");
    });
    expect(
      await screen.findByLabelText(/Coin delta for Sam Bay/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Coin delta for Brad/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-coins-params").textContent).not.toContain("q=");
    });
    expect(
      await screen.findByLabelText(/Coin delta for Brad/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Low balance" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-coins-params").textContent).toContain("group=low");
    });
    expect(screen.getByLabelText(/Coin delta for Sam Bay/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Coin delta for Brad/i)).not.toBeInTheDocument();
  });

  it("adjusts coins from the filtered list", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/coin-history?q=Sam"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/coin-history" element={<AdminCoinHistoryPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const delta = await screen.findByLabelText(/Coin delta for Sam Bay/i);
    await user.clear(delta);
    await user.type(delta, "25");
    await user.click(screen.getByRole("button", { name: "Adjust coins" }));

    await waitFor(() => {
      expect(api.adjustAdminCoins).toHaveBeenCalledWith(10, {
        delta: 25,
        note: "Admin correction",
      });
    });
    expect(await screen.findByText(/Balance corrected/i)).toBeInTheDocument();
  });

  it("fills the coin delta from quick amount chips and still accepts free-form", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/coin-history?q=Sam"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/coin-history" element={<AdminCoinHistoryPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const presets = await screen.findByRole("group", {
      name: /Coin adjust presets for Sam Bay/i,
    });
    expect(screen.getByText("Quick amount")).toBeInTheDocument();
    expect(within(presets).getByRole("button", { name: "+25 BC" })).toBeInTheDocument();
    expect(within(presets).getByRole("button", { name: "+50 BC" })).toBeInTheDocument();
    expect(within(presets).getByRole("button", { name: "+100 BC" })).toBeInTheDocument();
    expect(within(presets).getByRole("button", { name: "+250 BC" })).toBeInTheDocument();

    await user.click(within(presets).getByRole("button", { name: "+100 BC" }));
    const delta = screen.getByLabelText(/Coin delta for Sam Bay/i);
    expect(delta).toHaveValue(100);
    expect(within(presets).getByRole("button", { name: "+100 BC" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(presets).getByRole("button", { name: "+25 BC" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.clear(delta);
    await user.type(delta, "-15");
    expect(delta).toHaveValue(-15);
    expect(within(presets).getByRole("button", { name: "+100 BC" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(within(presets).getByRole("button", { name: "+50 BC" }));
    expect(delta).toHaveValue(50);
    await user.click(screen.getByRole("button", { name: "Adjust coins" }));

    await waitFor(() => {
      expect(api.adjustAdminCoins).toHaveBeenCalledWith(10, {
        delta: 50,
        note: "Admin correction",
      });
    });
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/coin-history?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/coin-history"
              element={
                <>
                  <AdminCoinHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching members")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter members by balance" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Coin delta for/i)).not.toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("admin-coins-params").textContent).toBe("");
    });
    expect(await screen.findByLabelText(/Coin delta for Sam Bay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Coin delta for Brad/i)).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
