import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { CarsPage } from "./CarsPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchCarFilters: vi.fn(),
  fetchModels: vi.fn(),
  searchCars: vi.fn(),
}));

import * as api from "../api";

describe("CarsPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchCarFilters).mockResolvedValue({
      filters: {
        makes: ["Porsche", "Ford"],
        models: ["Macan", "911"],
        bodyTypes: ["SUV", "Coupe"],
        fuels: ["Petrol"],
        colours: ["Laser Blue"],
        garages: [{ name: "Bay One", city: "London" }],
        conditions: ["new", "used"],
        yearMin: 2018,
        yearMax: 2026,
        coinPriceMin: 50,
        coinPriceMax: 900,
      },
    });
    vi.mocked(api.fetchModels).mockResolvedValue({ models: ["Macan", "911"] });
    vi.mocked(api.searchCars).mockResolvedValue({
      total: 1,
      limit: 24,
      offset: 0,
      listings: [
        {
          id: 9,
          make: "Porsche",
          model: "Macan",
          trimName: "GTS",
          bodyType: "SUV",
          fuel: "Petrol",
          drivetrain: "AWD",
          bhp: 434,
          topSpeedMph: 169,
          zeroToSixtySecs: 4.3,
          conditionType: "new",
          year: 2025,
          colour: "Laser Blue",
          mileage: 0,
          coinPrice: 420,
          status: "available",
          ownerLabel: "Bay One",
          ownerUserId: null,
          garageName: "Bay One",
          garageCity: "London",
        },
      ],
    });
  });

  it("shows bay hierarchy, filter panel sections, and keeps media listings", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/cars"]}>
        <AuthProvider>
          <CarsPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a car" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(screen.getByText(/Photo-first grid/i)).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(screen.getByRole("search", { name: /Car catalogue filters/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Search the bay" })).toBeInTheDocument();
    expect(screen.getByText("Core filters")).toBeInTheDocument();
    expect(screen.getByText("Ranges")).toBeInTheDocument();
    const compareLinks = screen.getAllByRole("link", { name: "Compare" });
    expect(compareLinks.some((link) => link.getAttribute("href") === "/compare")).toBe(true);
    const garageLinks = screen.getAllByRole("link", { name: "My cars" });
    expect(garageLinks.some((link) => link.getAttribute("href") === "/garage")).toBe(true);

    expect(await screen.findByText("Porsche Macan GTS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Listings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^More filters$/i }));
    expect(screen.getByLabelText(/^Colour$/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.searchCars).toHaveBeenCalled();
    });
  });
});
