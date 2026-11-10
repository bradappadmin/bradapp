import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
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

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="admin-inventory-params">{params.toString()}</div>;
}

const audi = {
  id: 42,
  conditionType: "used" as const,
  year: 2021,
  colour: "Midnight Black",
  mileage: 12000,
  coinPrice: 500,
  ownerLabel: "Garage stock",
  status: "available" as const,
  garageId: 1,
  make: "Audi",
  model: "RS6",
  trimName: "Avant",
  garageName: "Brad's Bay",
};

const ford = {
  id: 7,
  conditionType: "used" as const,
  year: 2019,
  colour: "Arctic White",
  mileage: 22000,
  coinPrice: 80,
  ownerLabel: "Sam Bay",
  status: "owned" as const,
  garageId: 2,
  make: "Ford",
  model: "Focus",
  trimName: "ST",
  garageName: "Member bay",
};

const porsche = {
  id: 9,
  conditionType: "used" as const,
  year: 2020,
  colour: "Racing Red",
  mileage: 8000,
  coinPrice: 900,
  ownerLabel: "Bay stock",
  status: "sold" as const,
  garageId: 1,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  garageName: "Brad's Bay",
};

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
      listings: [audi],
    });
    vi.mocked(api.fetchAdminCarModels).mockResolvedValue({ models: [] });
    vi.mocked(api.fetchAdminGarages).mockResolvedValue({ garages: [] });
    vi.mocked(api.patchAdminListing).mockResolvedValue({
      listing: { ...audi, colour: "Racing Red" },
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

describe("AdminInventoryPage listings search", () => {
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
      listings: [audi, ford, porsche],
    });
    vi.mocked(api.fetchAdminCarModels).mockResolvedValue({ models: [] });
    vi.mocked(api.fetchAdminGarages).mockResolvedValue({ garages: [] });
  });

  it("searches by make/model and filters with status chips", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/inventory"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/admin/inventory"
                element={
                  <>
                    <AdminInventoryPage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a listing" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(await screen.findByText(/#42 Audi RS6/i)).toBeInTheDocument();
    expect(screen.getByText(/#7 Ford Focus/i)).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search listings by make or model/i,
    });
    await user.clear(input);
    await user.type(input, "Audi");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-inventory-params").textContent).toContain("q=Audi");
    });
    expect(await screen.findByText(/#42 Audi RS6/i)).toBeInTheDocument();
    expect(screen.queryByText(/#7 Ford Focus/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-inventory-params").textContent).not.toContain("q=");
    });

    await user.click(screen.getByRole("button", { name: "For sale" }));
    await waitFor(() => {
      expect(screen.getByTestId("admin-inventory-params").textContent).toContain(
        "group=for_sale",
      );
    });
    expect(await screen.findByText(/#42 Audi RS6/i)).toBeInTheDocument();
    expect(screen.queryByText(/#7 Ford Focus/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/#9 Porsche 911/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sold/owned" }));
    expect(await screen.findByText(/#7 Ford Focus/i)).toBeInTheDocument();
    expect(screen.getByText(/#9 Porsche 911/i)).toBeInTheDocument();
    expect(screen.queryByText(/#42 Audi RS6/i)).not.toBeInTheDocument();
  });

  it("sorts the Directory via Sort the bay and persists sort in the URL", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchAdminListings).mockResolvedValue({
      listings: [audi, ford, porsche],
    });

    render(
      <MemoryRouter initialEntries={["/admin/inventory"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/admin/inventory"
                element={
                  <>
                    <AdminInventoryPage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sort the bay")).toBeInTheDocument();
    const sort = screen.getByRole("combobox", { name: /Sort inventory listings/i });
    expect(sort).toHaveValue("value_desc");

    function listingTitles(): string[] {
      return [...document.querySelectorAll("ul li p.text-mist")]
        .map((el) => el.textContent ?? "")
        .filter((text) => /#\d+/.test(text));
    }

    // Default Highest price: Porsche 900, Audi 500, Ford 80
    await waitFor(() => {
      expect(listingTitles()[0]).toMatch(/#9 Porsche 911/i);
    });
    expect(listingTitles()[1]).toMatch(/#42 Audi RS6/i);
    expect(listingTitles()[2]).toMatch(/#7 Ford Focus/i);

    await user.selectOptions(sort, "name_asc");
    expect(sort).toHaveValue("name_asc");
    await waitFor(() => {
      expect(screen.getByTestId("admin-inventory-params").textContent).toContain("sort=name_asc");
    });
    expect(listingTitles()[0]).toMatch(/#42 Audi RS6/i);
    expect(listingTitles()[1]).toMatch(/#7 Ford Focus/i);
    expect(listingTitles()[2]).toMatch(/#9 Porsche 911/i);

    expect(screen.getByRole("heading", { name: "Find a listing" })).toBeInTheDocument();
  });

  it("honours q, group, and sort from the URL on load", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/inventory?q=Ford&group=sold_owned&sort=name_asc"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/admin/inventory" element={<AdminInventoryPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/#7 Ford Focus/i)).toBeInTheDocument();
    expect(screen.queryByText(/#42 Audi RS6/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sold/owned" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("combobox", { name: /Sort inventory listings/i })).toHaveValue(
      "name_asc",
    );
    expect(
      screen.getByRole("searchbox", { name: /Search listings by make or model/i }),
    ).toHaveValue("Ford");
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/inventory?q=zzzz&sort=name_asc"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/admin/inventory"
                element={
                  <>
                    <AdminInventoryPage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching inventory listings")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a listing" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Paint colour for listing/i)).not.toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("admin-inventory-params").textContent).toBe("");
    });
    expect(await screen.findByText(/#42 Audi RS6/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Paint colour for listing 42/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Sort inventory listings/i })).toHaveValue(
      "value_desc",
    );
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
