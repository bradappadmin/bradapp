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
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchAdminInvites: vi.fn(),
  setAdminRequireInvite: vi.fn(),
  createAdminInvite: vi.fn(),
  revokeAdminInvite: vi.fn(),
}));

vi.mock("../../share-link", async () => {
  const actual = await vi.importActual<typeof import("../../share-link")>("../../share-link");
  return {
    ...actual,
    copyTextToClipboard: vi.fn().mockResolvedValue(true),
  };
});

import * as api from "../../api";
import { copyTextToClipboard } from "../../share-link";

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

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
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

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/invites?q=zzzz"]}>
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

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching invite codes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a code" })).toBeInTheDocument();
    expect(screen.getByLabelText("Create invite code")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: /Require invite code to sign up/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Copy invite code/i }),
    ).not.toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("admin-invites-params").textContent).toBe("");
    });
    expect(await screen.findByText("FAMILY-BAY-2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy invite code FAMILY-BAY-2026" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Create invite code")).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });

  it("copies an active invite code and toasts success", async () => {
    const user = userEvent.setup();
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={["/admin/invites"]}>
        <AuthProvider>
          <ToastProvider>
            <AdminInvitesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("FAMILY-BAY-2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy invite code FAMILY-BAY-2026" }),
    ).toBeInTheDocument();
    // Used/redeemed codes do not get a Copy control.
    expect(
      screen.queryByRole("button", { name: "Copy invite code USED-ONCE" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy invite code FAMILY-BAY-2026" }));
    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith("FAMILY-BAY-2026");
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/Copied FAMILY-BAY-2026/i);
    expect(screen.getByRole("button", { name: "Copy invite code FAMILY-BAY-2026" })).toHaveTextContent(
      "Copied",
    );
  });

  it("copies a signup link with the invite code and toasts success", async () => {
    const user = userEvent.setup();
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={["/admin/invites"]}>
        <AuthProvider>
          <ToastProvider>
            <AdminInvitesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("FAMILY-BAY-2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy signup link for FAMILY-BAY-2026" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy signup link for USED-ONCE" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy signup link for FAMILY-BAY-2026" }));
    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith(
        expect.stringMatching(/\/signup\?invite=FAMILY-BAY-2026$/),
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/Signup link copied/i);
    expect(
      screen.getByRole("button", { name: "Copy signup link for FAMILY-BAY-2026" }),
    ).toHaveTextContent("Link copied");
    expect(screen.getByRole("button", { name: "Copy invite code FAMILY-BAY-2026" })).toHaveTextContent(
      "Copy",
    );
  });
});
