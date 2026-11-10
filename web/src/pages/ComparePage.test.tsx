import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListingDetail } from "../cars";
import { AuthProvider } from "../auth-context";
import {
  COMPARE_SELECTION_KEY,
  type ComparePick,
} from "../compare-selection";
import { ToastProvider } from "../toast-context";
import { ComparePage } from "./ComparePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchListing: vi.fn(),
}));

import * as api from "../api";

const leftListing: ListingDetail = {
  id: 9,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  bodyType: "Coupe",
  fuel: "Petrol",
  drivetrain: "RWD",
  bhp: 502,
  topSpeedMph: 197,
  zeroToSixtySecs: 3.2,
  conditionType: "used",
  year: 2022,
  colour: "Racing Red",
  mileage: 12000,
  coinPrice: 420,
  status: "available",
  ownerLabel: "Bay",
  ownerUserId: null,
  garageName: "Bay",
  garageCity: "London",
  doors: 2,
  seats: 2,
  garageTagline: "Track bay",
};

const rightListing: ListingDetail = {
  ...leftListing,
  id: 11,
  make: "Audi",
  model: "RS6",
  trimName: "Avant",
  bodyType: "Estate",
  drivetrain: "AWD",
  colour: "Nardo Grey",
  year: 2019,
  bhp: 591,
  coinPrice: 310,
  doors: 5,
  seats: 5,
};

const meResponse = {
  user: {
    id: 2,
    email: "member@example.com",
    displayName: "Member",
    bio: null,
    role: "member" as const,
    coinBalance: 125,
  },
  dailyLogin: {
    amount: 25,
    claimDate: "2026-11-10",
    claimedToday: true,
    claimedJustNow: false,
    balance: 125,
  },
};

const porschePick: ComparePick = {
  id: 9,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  year: 2022,
  coinPrice: 420,
};

const audiPick: ComparePick = {
  id: 11,
  make: "Audi",
  model: "RS6",
  trimName: "Avant",
  year: 2019,
  coinPrice: 310,
};

function renderCompare(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ComparePage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
    vi.mocked(api.fetchListing).mockImplementation(async (id: number) => {
      if (id === 9) return { listing: leftListing, favourited: false };
      if (id === 11) return { listing: rightListing, favourited: false };
      throw new Error("missing");
    });
  });

  it("shows bay hierarchy around studio heroes and the specs table", async () => {
    renderCompare("/compare?a=9&b=11");

    expect(await screen.findByText(/Specs face-off · Midnight garage/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compare" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Compare car photos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Specs" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Compare actions" })).toBeInTheDocument();
    await waitFor(() => {
      const imgs = document.querySelectorAll("img");
      expect(imgs.length).toBeGreaterThanOrEqual(2);
      expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    });
    expect(screen.getByText("Brad Coin price")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /Empty compare bay/i })).not.toBeInTheDocument();
  });

  it("shows empty bay CTAs when no pair is selected", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(meResponse);
    renderCompare("/compare");

    expect(await screen.findByText("Empty bay")).toBeInTheDocument();
    const empty = screen.getByRole("status", { name: /Empty compare bay/i });
    expect(empty).toBeInTheDocument();
    expect(empty.querySelector('a[href="/favourites"]')?.textContent).toMatch(/Favourites/);
    expect(empty.querySelector('a[href="/cars"]')?.textContent).toMatch(/Browse cars/);
    expect(screen.queryByRole("region", { name: "Compare car photos" })).not.toBeInTheDocument();
  });

  it("prompts for a second car when only one pick is queued", async () => {
    sessionStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify([porschePick]));
    vi.mocked(api.fetchMe).mockResolvedValue(meResponse);
    renderCompare("/compare");

    expect(await screen.findByText("Need one more car")).toBeInTheDocument();
    const empty = screen.getByRole("status", { name: /Empty compare bay/i });
    expect(empty.querySelector('a[href="/favourites"]')).toBeTruthy();
    expect(empty.querySelector('a[href="/cars"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear picks" })).toBeInTheDocument();
    expect(screen.getByText(/Porsche 911/i)).toBeInTheDocument();
  });

  it("offers open side-by-side when two picks are queued without URL", async () => {
    sessionStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify([porschePick, audiPick]));
    vi.mocked(api.fetchMe).mockResolvedValue(meResponse);
    renderCompare("/compare");

    expect(await screen.findByText("Ready to compare")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open side-by-side" })).toHaveAttribute(
      "href",
      "/compare?a=9&b=11",
    );
    const empty = screen.getByRole("status", { name: /Empty compare bay/i });
    expect(empty.querySelector('a[href="/favourites"]')).toBeTruthy();
    expect(empty.querySelector('a[href="/cars"]')).toBeTruthy();
  });
});
