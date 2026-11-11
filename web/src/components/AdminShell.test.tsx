import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { AdminShell } from "./AdminShell";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
}));

import * as api from "../api";

describe("AdminShell", () => {
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
  });

  it("renders Midnight Garage admin chrome and section nav", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AuthProvider>
          <AdminShell title="Accounts" description="Correct family accounts." wide>
            <p>Panel body</p>
          </AdminShell>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByText("Admin bay")).toBeInTheDocument();
    expect(document.querySelector(".admin-bay-glow")).not.toBeNull();
    expect(document.querySelector(".admin-subnav")).not.toBeNull();

    const nav = screen.getByRole("navigation", { name: "Admin" });
    expect(nav).toHaveTextContent("Overview");
    expect(nav).toHaveTextContent("Accounts");
    expect(nav).toHaveTextContent("Invites");
    expect(nav).toHaveTextContent("Coins");
    expect(nav).toHaveTextContent("Cars");
    expect(nav).toHaveTextContent("Reviews");
  });
});
