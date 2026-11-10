import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { AccountPage } from "./AccountPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  BIO_MAX_LENGTH: 160,
}));

import * as api from "../api";

const memberUser = {
  id: 42,
  email: "member@example.com",
  displayName: "Sam Bay",
  bio: "Collects pace.",
  role: "member" as const,
  coinBalance: 750,
};

describe("AccountPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: memberUser,
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 750,
      },
    });
    vi.mocked(api.updateProfile).mockResolvedValue({
      user: { ...memberUser, displayName: "Sam Bay Updated", bio: "New bio." },
    });
    vi.mocked(api.changePassword).mockResolvedValue({ ok: true });
  });

  it("shows bay hierarchy and account panels", async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AuthProvider>
          <ToastProvider>
            <AccountPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Bay profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Brad Coins" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Change password" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Account bay notes")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Sam Bay")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Collects pace.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open public garage" })).toHaveAttribute(
      "href",
      "/members/42",
    );
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open coin ledger" })).toHaveAttribute(
      "href",
      "/ledger",
    );
  });

  it("keeps bay profile save behavior", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AuthProvider>
          <ToastProvider>
            <AccountPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const nameInput = await screen.findByDisplayValue("Sam Bay");
    await user.clear(nameInput);
    await user.type(nameInput, "Sam Bay Updated");
    const bioInput = screen.getByLabelText("Garage bio");
    await user.clear(bioInput);
    await user.type(bioInput, "New bio.");
    await user.click(screen.getByRole("button", { name: "Save bay profile" }));

    await waitFor(() => {
      expect(api.updateProfile).toHaveBeenCalledWith({
        displayName: "Sam Bay Updated",
        bio: "New bio.",
      });
    });
    expect((await screen.findAllByText(/Bay name and bio saved/i)).length).toBeGreaterThan(0);
  });

  it("validates password confirmation before calling the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AuthProvider>
          <ToastProvider>
            <AccountPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("Sam Bay");
    await user.type(screen.getByLabelText("Current password"), "old-secret-pass");
    await user.type(screen.getByLabelText("New password"), "new-secret-pass");
    await user.type(screen.getByLabelText("Confirm new password"), "mismatch-pass");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      await screen.findByText(/New password and confirmation do not match/i),
    ).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });
});
