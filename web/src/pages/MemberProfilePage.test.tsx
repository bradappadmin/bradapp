import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { MemberProfilePage } from "./MemberProfilePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchMemberProfile: vi.fn(),
}));

import * as api from "../api";

describe("MemberProfilePage media cards", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
        bio: null,
        role: "member",
        coinBalance: 200,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 200,
      },
    });
    vi.mocked(api.fetchMemberProfile).mockResolvedValue({
      member: {
        id: 7,
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        roleLabel: "Member",
        coinBalance: 880,
        carCount: 1,
      },
      cars: [
        {
          id: 42,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          year: 2022,
          colour: "Racing Red",
          status: "owned",
          coinPrice: 420,
        },
      ],
    });
  });

  it("renders the public garage as photo-first media cards", async () => {
    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <Routes>
            <Route path="/members/:id" element={<MemberProfilePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay Friend" })).toBeInTheDocument();
    expect(screen.getByText("Collects pace in the family bay.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Member garage cars" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
