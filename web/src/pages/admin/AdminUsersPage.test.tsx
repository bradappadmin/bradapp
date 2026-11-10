import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
import { AdminUsersPage } from "./AdminUsersPage";

vi.mock("../../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchAdminUsers: vi.fn(),
  patchAdminUser: vi.fn(),
  adjustAdminCoins: vi.fn(),
}));

import * as api from "../../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="admin-users-params">{params.toString()}</div>;
}

const sam = {
  id: 10,
  email: "sam@example.com",
  displayName: "Sam Bay",
  role: "member" as const,
  coinBalance: 200,
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

const frozen = {
  id: 11,
  email: "frozen@example.com",
  displayName: "Frozen Friend",
  role: "member" as const,
  coinBalance: 50,
  accountStatus: "frozen" as const,
};

describe("AdminUsersPage accounts search", () => {
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
    vi.mocked(api.fetchAdminUsers).mockResolvedValue({ users: [sam, brad, frozen] });
    vi.mocked(api.adjustAdminCoins).mockResolvedValue({
      balance: 450,
      ledger: [],
    });
  });

  it("searches by name/email and filters with type chips", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/users"
              element={
                <>
                  <AdminUsersPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find an account" })).toBeInTheDocument();
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.getByText("Brad")).toBeInTheDocument();
    expect(screen.getByText("Frozen Friend")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search accounts by display name or email/i,
    });
    await user.clear(input);
    await user.type(input, "sam");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-users-params").textContent).toContain("q=sam");
    });
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.queryByText("Frozen Friend")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-users-params").textContent).not.toContain("q=");
    });

    await user.click(screen.getByRole("button", { name: "Admins" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-users-params").textContent).toContain("group=admins");
    });
    expect(await screen.findByText("Brad")).toBeInTheDocument();
    expect(screen.queryByText("Sam Bay")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Frozen" }));
    expect(await screen.findByText("Frozen Friend")).toBeInTheDocument();
    expect(screen.queryByText("Brad")).not.toBeInTheDocument();
  });

  it("honours q and group from the URL on load", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/users?q=friend&group=frozen"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Frozen Friend")).toBeInTheDocument();
    expect(screen.queryByText("Sam Bay")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Frozen" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("searchbox", { name: /Search accounts by display name or email/i }),
    ).toHaveValue("friend");
  });

  it("fills the coin delta from quick amount chips on Accounts", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/users?q=Sam"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const presets = await screen.findByRole("group", {
      name: /Coin adjust presets for Sam Bay/i,
    });
    await user.click(within(presets).getByRole("button", { name: "+250 BC" }));
    expect(screen.getByLabelText(/Coin delta for Sam Bay/i)).toHaveValue(250);
    expect(within(presets).getByRole("button", { name: "+250 BC" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Adjust coins" }));
    await waitFor(() => {
      expect(api.adjustAdminCoins).toHaveBeenCalledWith(10, {
        delta: 250,
        note: "Admin correction",
      });
    });
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/users?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/users"
              element={
                <>
                  <AdminUsersPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching accounts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find an account" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter accounts by type" })).toBeInTheDocument();
    expect(screen.queryByText("Sam Bay")).not.toBeInTheDocument();
    expect(screen.queryByText("Brad")).not.toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("admin-users-params").textContent).toBe("");
    });
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.getByText("Brad")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter accounts by type" })).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
