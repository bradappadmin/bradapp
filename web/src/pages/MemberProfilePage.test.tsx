import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { MemberProfilePage } from "./MemberProfilePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchMemberProfile: vi.fn(),
  setGarageShowcase: vi.fn(),
}));

import * as api from "../api";

const porsche = {
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
};

const audi = {
  id: 11,
  make: "Audi",
  model: "RS3",
  trimName: "Vorsprung",
  bodyType: "Saloon",
  bhp: 400,
  topSpeedMph: 155,
  zeroToSixtySecs: 3.8,
  year: 2021,
  colour: "Nardo Grey",
  status: "owned",
  coinPrice: 520,
};

describe("MemberProfilePage showcase garage", () => {
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
    vi.mocked(api.setGarageShowcase).mockResolvedValue({ ok: true, showcaseListingId: 42 });
    vi.mocked(api.fetchMemberProfile).mockResolvedValue({
      member: {
        id: 7,
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        roleLabel: "Member",
        coinBalance: 880,
        carCount: 2,
      },
      cars: [porsche, audi],
      showcase: audi,
      showcaseSource: "highest_value",
      showcaseListingId: null,
    });
  });

  it("renders the showcase hero above photo-first garage cards", async () => {
    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay Friend" })).toBeInTheDocument();
    expect(screen.getByText("Collects pace in the family bay.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Audi RS3/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Highest-value car in the bay/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Member garage cars" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );
    expect(
      screen.getAllByRole("link", { name: "Offer trade" }).some(
        (link) => link.getAttribute("href") === "/trades?with=7&theirCar=42",
      ),
    ).toBe(true);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("lets you pin a showcase car on your own public garage", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 7,
        email: "owner@example.com",
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        coinBalance: 880,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 880,
      },
    });
    vi.mocked(api.fetchMemberProfile)
      .mockResolvedValueOnce({
        member: {
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 880,
          carCount: 2,
        },
        cars: [porsche, audi],
        showcase: audi,
        showcaseSource: "highest_value",
        showcaseListingId: null,
      })
      .mockResolvedValue({
        member: {
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 880,
          carCount: 2,
        },
        cars: [porsche, audi],
        showcase: porsche,
        showcaseSource: "pinned",
        showcaseListingId: 42,
      });

    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Bay Friend \(you\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();
    const pinButtons = screen.getAllByRole("button", { name: "Make showcase" });
    await user.click(pinButtons[0]!);
    await vi.waitFor(() => {
      expect(api.setGarageShowcase).toHaveBeenCalled();
    });
    expect((await screen.findAllByText(/Pinned showcase/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Unpin showcase" }).length).toBeGreaterThan(0);
  });
});
