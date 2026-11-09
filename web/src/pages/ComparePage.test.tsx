import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListingDetail } from "../cars";
import { AuthProvider } from "../auth-context";
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

describe("ComparePage photos", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchListing).mockImplementation(async (id: number) => {
      if (id === 9) return { listing: leftListing, favourited: false };
      if (id === 11) return { listing: rightListing, favourited: false };
      throw new Error("missing");
    });
  });

  it("shows studio heroes for both listings before the specs table", async () => {
    render(
      <MemoryRouter initialEntries={["/compare?a=9&b=11"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/compare" element={<ComparePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Compare car photos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Specs" })).toBeInTheDocument();
    await waitFor(() => {
      const imgs = document.querySelectorAll("img");
      expect(imgs.length).toBeGreaterThanOrEqual(2);
      expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    });
    expect(screen.getByText("Brad Coin price")).toBeInTheDocument();
  });
});
