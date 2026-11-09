import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { MembersPage } from "./MembersPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchMembers: vi.fn(),
}));

import * as api from "../api";

const sam = {
  id: 177,
  displayName: "Sam Bay",
  bio: "Collects pace.",
  role: "member" as const,
  roleLabel: "Member",
  carCount: 2,
  coinBalance: 300,
};

const jordan = {
  id: 178,
  displayName: "Jordan Pace",
  bio: null,
  role: "member" as const,
  roleLabel: "Member",
  carCount: 1,
  coinBalance: 200,
};

describe("MembersPage name search", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockImplementation(async (params) => {
      const q = params?.q?.trim().toLowerCase() ?? "";
      const all = [sam, jordan];
      const members = q
        ? all.filter((m) => m.displayName.toLowerCase().includes(q))
        : all;
      return { members, q: q || null };
    });
  });

  it("lists members and searches by display name via q", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/members"]}>
        <AuthProvider>
          <MembersPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Members" })).toBeInTheDocument();
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.getByText("Jordan Pace")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", { name: /Search members by display name/i });
    await user.clear(input);
    await user.type(input, "Sam");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(api.fetchMembers).toHaveBeenCalledWith({ q: "Sam" });
    });
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.queryByText("Jordan Pace")).not.toBeInTheDocument();
    expect(screen.getByText(/Showing matches for/i)).toBeInTheDocument();
  });

  it("honours q from the URL on load", async () => {
    render(
      <MemoryRouter initialEntries={["/members?q=Jordan"]}>
        <AuthProvider>
          <MembersPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.fetchMembers).toHaveBeenCalledWith({ q: "Jordan" });
    });
    expect(await screen.findByText("Jordan Pace")).toBeInTheDocument();
    expect(screen.queryByText("Sam Bay")).not.toBeInTheDocument();
  });
});
