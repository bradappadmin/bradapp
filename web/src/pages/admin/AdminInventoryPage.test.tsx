import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../auth-context";
import { ToastProvider } from "../../toast-context";
import { AdminInventoryPage } from "./AdminInventoryPage";

vi.mock("../../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchAdminListings: vi.fn(),
  fetchAdminCarModels: vi.fn(),
  fetchAdminGarages: vi.fn(),
  patchAdminListing: vi.fn(),
  patchAdminCarModel: vi.fn(),
  patchAdminGarage: vi.fn(),
}));

import * as api from "../../api";

describe("AdminInventoryPage listing paint", () => {
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
    vi.mocked(api.fetchAdminListings).mockResolvedValue({
      listings: [
        {
          id: 42,
          conditionType: "used",
          year: 2021,
          colour: "Midnight Black",
          mileage: 12000,
          coinPrice: 500,
          ownerLabel: "Garage stock",
          status: "available",
          garageId: 1,
          make: "Audi",
          model: "RS6",
          trimName: "Avant",
          garageName: "Brad's Bay",
        },
      ],
    });
    vi.mocked(api.fetchAdminCarModels).mockResolvedValue({ models: [] });
    vi.mocked(api.fetchAdminGarages).mockResolvedValue({ garages: [] });
    vi.mocked(api.patchAdminListing).mockResolvedValue({
      listing: {
        id: 42,
        conditionType: "used",
        year: 2021,
        colour: "Racing Red",
        mileage: 12000,
        coinPrice: 500,
        ownerLabel: "Garage stock",
        status: "available",
        garageId: 1,
        make: "Audi",
        model: "RS6",
        trimName: "Avant",
        garageName: "Brad's Bay",
      },
    });
  });

  it("shows a studio paint preview and saves a curated colour", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <AdminInventoryPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Cars & garages" })).toBeInTheDocument();
    const thumb = await screen.findByRole("img", { name: /Audi RS6 in Midnight Black/i });
    expect(thumb.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(thumb.getAttribute("src") ?? "").toContain("paintDescription=Black");

    const paint = screen.getByLabelText(/Paint colour for listing 42/i);
    await user.selectOptions(paint, "Racing Red");

    expect(await screen.findByRole("img", { name: /Audi RS6 in Racing Red/i })).toHaveAttribute(
      "src",
      expect.stringContaining("paintDescription=Red"),
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(api.patchAdminListing).toHaveBeenCalledWith(42, {
      coinPrice: 500,
      colour: "Racing Red",
    });
    expect(await screen.findByText(/Listing #42 updated/i)).toBeInTheDocument();
  });
});
