import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
import { ToastProvider } from "../../toast-context";
import { AdminInvitesPage } from "./AdminInvitesPage";

vi.mock("../../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchAdminInvites: vi.fn(),
  setAdminRequireInvite: vi.fn(),
  createAdminInvite: vi.fn(),
  revokeAdminInvite: vi.fn(),
}));

import * as api from "../../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="admin-invites-params">{params.toString()}</div>;
}

const active = {
  id: 1,
  code: "FAMILY-BAY-2026",
  createdByUserId: 1,
  createdByDisplayName: "Brad",
  createdAt: "2026-11-01T00:00:00.000Z",
  maxUses: null as number | null,
  usesCount: 0,
  expiresAt: null as string | null,
  revokedAt: null as string | null,
};

const usedUp = {
  id: 2,
  code: "USED-ONCE",
  createdByUserId: 10,
  createdByDisplayName: "Sam Bay",
  createdAt: "2026-11-02T00:00:00.000Z",
  maxUses: 1,
  usesCount: 1,
  expiresAt: null as string | null,
  revokedAt: null as string | null,
};

describe("AdminInvitesPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 1,
        email: "admin@example.com",
        displayName: "Bay Admin",
        bio: null,
        role: "admin",
        coinBalance: 100,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 100,
      },
    });
    vi.mocked(api.fetchAdminInvites).mockResolvedValue({
      invites: [active, usedUp],
      requireInviteCode: false,
    });
    vi.mocked(api.setAdminRequireInvite).mockResolvedValue({ requireInviteCode: true });
  });

  it("toggles require invite code for signup", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <AdminInvitesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Family invites" })).toBeInTheDocument();
    const toggle = await screen.findByRole("switch", {
      name: /Require invite code to sign up/i,
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(api.setAdminRequireInvite).toHaveBeenCalledWith(true);
    expect(await screen.findByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/Signup now requires a valid invite code/i)).toBeInTheDocument();
  });

  it("searches codes and filters with status chips", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/invites"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/admin/invites"
                element={
                  <>
                    <AdminInvitesPage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a code" })).toBeInTheDocument();
    expect(await screen.findByText("FAMILY-BAY-2026")).toBeInTheDocument();
    expect(screen.getByText("USED-ONCE")).toBeInTheDocument();
    expect(screen.getByLabelText("Create invite code")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: /Require invite code to sign up/i }),
    ).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search invite codes by code or creator/i,
    });
    await user.clear(input);
    await user.type(input, "family");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-invites-params").textContent).toContain("q=family");
    });
    expect(screen.getByText("FAMILY-BAY-2026")).toBeInTheDocument();
    expect(screen.queryByText("USED-ONCE")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-invites-params").textContent).not.toContain("q=");
    });
    expect(await screen.findByText("USED-ONCE")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Used/redeemed" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-invites-params").textContent).toContain("group=used");
    });
    expect(screen.getByText("USED-ONCE")).toBeInTheDocument();
    expect(screen.queryByText("FAMILY-BAY-2026")).not.toBeInTheDocument();
  });

  it("shows empty filter state", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/invites?q=zzzz"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/admin/invites" element={<AdminInvitesPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});
