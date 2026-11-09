import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
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

describe("AdminInvitesPage require-invite toggle", () => {
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
      invites: [],
      requireInviteCode: false,
    });
    vi.mocked(api.setAdminRequireInvite).mockResolvedValue({ requireInviteCode: true });
  });

  it("toggles require invite code for signup", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminInvitesPage />
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
});
