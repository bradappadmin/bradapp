import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { GaragePage } from "./GaragePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchGarage: vi.fn(),
  fetchWallet: vi.fn(),
  fetchSoldHistory: vi.fn(),
  fetchPurchaseHistory: vi.fn(),
  setGarageShowcase: vi.fn(),
}));

import * as api from "../api";

describe("GaragePage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "member@example.com",
        displayName: "Member",
        bio: null,
        role: "member",
        coinBalance: 500,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 500,
      },
    });
    vi.mocked(api.fetchWallet).mockResolvedValue({ balance: 500, ledger: [] });
    vi.mocked(api.fetchSoldHistory).mockResolvedValue({ sales: [] });
    vi.mocked(api.fetchPurchaseHistory).mockResolvedValue({ purchases: [] });
    vi.mocked(api.setGarageShowcase).mockImplementation(async (listingId) => ({
      ok: true,
      showcaseListingId: listingId,
    }));
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 1240,
      showcaseListingId: null,
      cars: [
        {
          id: 9,
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          bhp: 502,
          topSpeedMph: 197,
          zeroToSixtySecs: 3.2,
          conditionType: "used",
          year: 2022,
          colour: "Racing Red",
          mileage: 12000,
          coinPrice: 420,
          status: "owned",
          ownerLabel: "You",
          garageName: "Bay",
          garageCity: "London",
        },
        {
          id: 11,
          make: "Audi",
          model: "RS3",
          trimName: "Vorsprung",
          bodyType: "Saloon",
          bhp: 400,
          topSpeedMph: 155,
          zeroToSixtySecs: 3.8,
          conditionType: "used",
          year: 2021,
          colour: "Nardo Grey",
          mileage: 9000,
          coinPrice: 520,
          status: "owned",
          ownerLabel: "You",
          garageName: "Bay",
          garageCity: "London",
        },
        {
          id: 10,
          make: "Ford",
          model: "Focus",
          trimName: "ST",
          bodyType: "Hatchback",
          bhp: 280,
          topSpeedMph: 155,
          zeroToSixtySecs: 5.7,
          conditionType: "used",
          year: 2020,
          colour: "Blue",
          mileage: 18000,
          coinPrice: 400,
          status: "available",
          ownerLabel: "You",
          garageName: "Bay",
          garageCity: "London",
        },
      ],
    });
  });

  it("shows bay hierarchy, owned vs for-sale sections, and media cards", async () => {
    render(
      <MemoryRouter initialEntries={["/garage"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/garage" element={<GaragePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "My cars" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(await screen.findByText(/Garage value/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Owned" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "For sale" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Purchases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sold" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coin ledger" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();

    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByRole("link", { name: /Ford Focus ST/i })).toHaveAttribute(
      "href",
      "/cars/10",
    );
    expect(screen.getAllByRole("button", { name: "List for sale" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Update price" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlist" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Make showcase" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Showcase: highest value/i)).toBeInTheDocument();

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("pins a showcase car from My cars", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/garage"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/garage" element={<GaragePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const pinButtons = await screen.findAllByRole("button", { name: "Make showcase" });
    await user.click(pinButtons[0]!);
    await vi.waitFor(() => {
      expect(api.setGarageShowcase).toHaveBeenCalled();
    });
    expect(await screen.findByRole("button", { name: "Unpin showcase" })).toBeInTheDocument();
    expect(screen.getAllByText(/Showcase pinned/i).length).toBeGreaterThan(0);
  });

  it("sorts Owned by name via URL-backed control", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/garage"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/garage" element={<GaragePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /Audi RS3/i })).toBeInTheDocument();
    const ownedHeading = screen.getByRole("heading", { name: "Owned" });
    const ownedSection = ownedHeading.closest("section");
    expect(ownedSection).not.toBeNull();
    const ownedLinks = ownedSection!.querySelectorAll("a[href^='/cars/']");
    expect(ownedLinks[0]?.textContent).toMatch(/Audi RS3/i);

    const sort = screen.getByRole("combobox", { name: /Sort Owned and For sale cars/i });
    await user.selectOptions(sort, "name_asc");
    expect(sort).toHaveValue("name_asc");

    const resortedOwned = screen.getByRole("heading", { name: "Owned" }).closest("section");
    const resortedLinks = resortedOwned!.querySelectorAll("a[href^='/cars/']");
    expect(resortedLinks[0]?.textContent).toMatch(/Audi RS3/i);
    expect(resortedLinks[1]?.textContent).toMatch(/Porsche 911/i);
  });
});
