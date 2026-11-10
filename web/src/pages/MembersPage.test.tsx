import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { MembersPage } from "./MembersPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchMembers: vi.fn(),
}));

import * as api from "../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="members-params">{params.toString()}</div>;
}

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

const empty = {
  id: 179,
  displayName: "Empty Eddy",
  bio: "Still shopping.",
  role: "member" as const,
  roleLabel: "Member",
  carCount: 0,
  coinBalance: 100,
};

describe("MembersPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockImplementation(async (params) => {
      const q = params?.q?.trim().toLowerCase() ?? "";
      const all = [sam, jordan, empty];
      const members = q
        ? all.filter((m) => m.displayName.toLowerCase().includes(q))
        : all;
      return { members, q: q || null };
    });
  });

  it("shows bay hierarchy, directory, and name search", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/members"]}>
        <AuthProvider>
          <MembersPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Directory" })).toBeInTheDocument();
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.getByText("Jordan Pace")).toBeInTheDocument();
    expect(screen.getByText("Empty Eddy")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter members by garage cars")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", { name: /Search members by display name/i });
    await user.clear(input);
    await user.type(input, "Sam");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(api.fetchMembers).toHaveBeenCalledWith({ q: "Sam" });
    });
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.queryByText("Jordan Pace")).not.toBeInTheDocument();
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
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

  it("filters Has cars and Empty bay via group chips", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/members"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/members"
              element={
                <>
                  <MembersPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empty Eddy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Has cars" }));
    await waitFor(() => {
      expect(screen.getByTestId("members-params").textContent).toContain("group=has_cars");
    });
    expect(await screen.findByText("Sam Bay")).toBeInTheDocument();
    expect(screen.getByText("Jordan Pace")).toBeInTheDocument();
    expect(screen.queryByText("Empty Eddy")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Empty bay" }));
    await waitFor(() => {
      expect(screen.getByTestId("members-params").textContent).toContain("group=empty");
    });
    expect(await screen.findByText("Empty Eddy")).toBeInTheDocument();
    expect(screen.queryByText("Sam Bay")).not.toBeInTheDocument();
  });

  it("honours group from the URL with name search", async () => {
    render(
      <MemoryRouter initialEntries={["/members?q=Eddy&group=empty"]}>
        <AuthProvider>
          <Routes>
            <Route path="/members" element={<MembersPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.fetchMembers).toHaveBeenCalledWith({ q: "Eddy" });
    });
    expect(await screen.findByText("Empty Eddy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Empty bay" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a clear no-results state with clear CTA", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue({ members: [], q: "zzzz" });

    render(
      <MemoryRouter initialEntries={["/members?q=zzzz"]}>
        <AuthProvider>
          <MembersPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Directory" })).not.toBeInTheDocument();
  });
});
