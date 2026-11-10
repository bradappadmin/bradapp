import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { COMPARE_SELECTION_KEY, clearCompareSelection } from "../compare-selection";
import { CarsPage } from "./CarsPage";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="cars-search-params">{params.toString()}</div>;
}

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchCarFilters: vi.fn(),
  fetchModels: vi.fn(),
  searchCars: vi.fn(),
}));

import * as api from "../api";

const macan = {
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
  conditionType: "new" as const,
  year: 2025,
  colour: "Laser Blue",
  mileage: 0,
  coinPrice: 420,
  status: "available" as const,
  ownerLabel: "Bay One",
  ownerUserId: null,
  garageName: "Bay One",
  garageCity: "London",
};

const focusSt = {
  id: 11,
  make: "Ford",
  model: "Focus",
  trimName: "ST",
  bodyType: "Hatchback",
  fuel: "Petrol",
  drivetrain: "FWD",
  bhp: 280,
  topSpeedMph: 155,
  zeroToSixtySecs: 5.7,
  conditionType: "used" as const,
  year: 2020,
  colour: "Blue",
  mileage: 18000,
  coinPrice: 400,
  status: "available" as const,
  ownerLabel: "Bay One",
  ownerUserId: null,
  garageName: "Bay One",
  garageCity: "London",
};

describe("CarsPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    clearCompareSelection();
  });

  beforeEach(() => {
    clearCompareSelection();
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
      listings: [macan],
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

  it("sorts via Sort the bay control and persists sort in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/cars"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/cars"
              element={
                <>
                  <CarsPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a car" })).toBeInTheDocument();
    const sort = await screen.findByRole("combobox", {
      name: /Sort catalogue by price or year/i,
    });
    expect(sort).toHaveValue("price_asc");
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lowest price" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Highest price" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest" })).toBeInTheDocument();

    await user.selectOptions(sort, "price_desc");
    expect(sort).toHaveValue("price_desc");

    await waitFor(() => {
      expect(api.searchCars).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "price_desc" }),
      );
    });
    expect(screen.getByTestId("cars-search-params").textContent).toContain("sort=price_desc");

    await user.selectOptions(sort, "year_desc");
    await waitFor(() => {
      expect(api.searchCars).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "year_desc" }),
      );
    });
    expect(screen.getByTestId("cars-search-params").textContent).toContain("sort=year_desc");
  });

  it("reads sort from the URL on load", async () => {
    render(
      <MemoryRouter initialEntries={["/cars?sort=year_desc"]}>
        <AuthProvider>
          <Routes>
            <Route path="/cars" element={<CarsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const sort = await screen.findByRole("combobox", {
      name: /Sort catalogue by price or year/i,
    });
    expect(sort).toHaveValue("year_desc");
    await waitFor(() => {
      expect(api.searchCars).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "year_desc" }),
      );
    });
  });

  it("shows No matches and Clear filters when search yields none", async () => {
    const user = userEvent.setup();
    vi.mocked(api.searchCars).mockResolvedValue({
      total: 0,
      limit: 24,
      offset: 0,
      listings: [],
    });

    render(
      <MemoryRouter initialEntries={["/cars?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/cars"
              element={
                <>
                  <CarsPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching cars")).toBeInTheDocument();
    expect(screen.getByText(/Nothing for sale matches “zzzz”/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Search the bay" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(screen.getByTestId("cars-search-params").textContent).toBe("");
    });
  });

  it("keeps Search the bay when listings match", async () => {
    render(
      <MemoryRouter initialEntries={["/cars"]}>
        <AuthProvider>
          <CarsPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Porsche Macan GTS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Search the bay" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });

  it("hides Search the bay when the catalogue is empty with no filters", async () => {
    vi.mocked(api.searchCars).mockResolvedValue({
      total: 0,
      limit: 24,
      offset: 0,
      listings: [],
    });

    render(
      <MemoryRouter initialEntries={["/cars"]}>
        <AuthProvider>
          <CarsPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Empty cars bay")).toBeInTheDocument();
    expect(screen.getByText("Nothing for sale")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Search the bay" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("queues catalogue cards into the compare tray shared with listing detail", async () => {
    const user = userEvent.setup();
    vi.mocked(api.searchCars).mockResolvedValue({
      total: 2,
      limit: 24,
      offset: 0,
      listings: [macan, focusSt],
    });

    render(
      <MemoryRouter initialEntries={["/cars"]}>
        <AuthProvider>
          <CarsPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Porsche Macan GTS")).toBeInTheDocument();
    expect(screen.getByText("Ford Focus ST")).toBeInTheDocument();
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();

    const addButtonsStart = screen.getAllByRole("button", { name: "Add to compare" });
    expect(addButtonsStart).toHaveLength(2);
    await user.click(addButtonsStart[0]!);
    expect(screen.getByLabelText("Compare selection")).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1\/2\)/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(COMPARE_SELECTION_KEY)).toContain('"id":9');
    expect(screen.getByRole("button", { name: "Remove from compare" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const addButtons = screen.getAllByRole("button", { name: "Add to compare" });
    expect(addButtons).toHaveLength(1);
    await user.click(addButtons[0]!);
    expect(screen.getByText(/Compare \(2\/2\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Side by side" })).toHaveAttribute(
      "href",
      "/compare?a=9&b=11",
    );
    // Search / sort stay while compare tray is active.
    expect(screen.getByRole("heading", { name: "Search the bay" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
  });
});
