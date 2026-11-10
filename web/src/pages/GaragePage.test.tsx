import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { COMPARE_SELECTION_KEY, clearCompareSelection } from "../compare-selection";
import { ToastProvider } from "../toast-context";
import { GaragePage } from "./GaragePage";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="garage-params">{params.toString()}</div>;
}

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchGarage: vi.fn(),
  fetchWallet: vi.fn(),
  fetchSoldHistory: vi.fn(),
  fetchPurchaseHistory: vi.fn(),
  setGarageShowcase: vi.fn(),
  sellListing: vi.fn(),
  unlistListing: vi.fn(),
  updateListingPaint: vi.fn(),
}));

vi.mock("../share-link", async () => {
  const actual = await vi.importActual<typeof import("../share-link")>("../share-link");
  return {
    ...actual,
    copyTextToClipboard: vi.fn(),
  };
});

import * as api from "../api";
import { copyTextToClipboard } from "../share-link";

describe("GaragePage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    clearCompareSelection();
  });

  beforeEach(() => {
    clearCompareSelection();
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
    vi.mocked(api.sellListing).mockResolvedValue({
      ok: true,
      listingId: 9,
      coinPrice: 100,
      status: "available",
    });
    vi.mocked(api.updateListingPaint).mockResolvedValue({
      ok: true,
      listingId: 10,
      colour: "Laser Blue",
      status: "available",
    });
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
    expect(await screen.findByRole("heading", { name: "Owned" })).toBeInTheDocument();
    expect(screen.getByText(/Garage value \d/i)).toBeInTheDocument();
    expect(screen.getByText("Top Trumps peek")).toBeInTheDocument();
    expect(
      screen.getByText(/Top Trumps peek under the studio photo \(Power \/ 0–60 \/ Top speed\)/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Garage bay value" })).toBeInTheDocument();
    // Strip sums listing coin prices on held cars (420 + 520 + 400) — sold history excluded.
    expect(screen.getByRole("heading", { name: /Bay value 1,340 BC/i })).toBeInTheDocument();
    expect(screen.getByText("3 cars in your bay")).toBeInTheDocument();
    expect(screen.getByText(/sold history stays out of the total/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "For sale" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Purchases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sold" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coin ledger" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Highest price" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lowest price" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Name A–Z" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Name Z–A" })).toBeInTheDocument();
    expect(screen.getByText(/same as Favourites/i)).toBeInTheDocument();

    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByRole("link", { name: /Ford Focus ST/i })).toHaveAttribute(
      "href",
      "/cars/10",
    );
    // Owned + for-sale media cards share the catalogue Top Trumps peek under the photo.
    const peeks = screen.getAllByLabelText("Top Trumps peek");
    expect(peeks.length).toBeGreaterThanOrEqual(3);
    expect(peeks[0].textContent).toMatch(/Power/);
    expect(peeks[0].textContent).toMatch(/0–60/);
    expect(peeks[0].textContent).toMatch(/Top speed/);
    expect(screen.getByText("502")).toBeInTheDocument();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("197 mph")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "List for sale" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Update price" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlist" })).toBeInTheDocument();
    expect(screen.getAllByText("Quick price").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("group", { name: /Sell price presets for Porsche 911/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Paint colour for Porsche 911/i }),
    ).toHaveValue("Racing Red");
    expect(
      screen.getByRole("combobox", { name: /Paint colour for Ford Focus/i }),
    ).toHaveValue("Blue");
    expect(screen.getAllByRole("button", { name: "50 BC" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "100 BC" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "250 BC" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "500 BC" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Make showcase" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Showcase: highest value/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Public garage" })).toHaveAttribute(
      "href",
      "/members/2",
    );
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Compare" }).some((a) => a.getAttribute("href") === "/compare"),
    ).toBe(true);
    expect(screen.getAllByRole("button", { name: "Add to compare" }).length).toBe(3);
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("queues owned and for-sale cars into the session compare tray", async () => {
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

    expect(await screen.findByRole("heading", { name: "Owned" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();

    const porscheCard = screen.getByRole("link", { name: /Porsche 911 GT3/i }).closest("li");
    const fordCard = screen.getByRole("link", { name: /Ford Focus ST/i }).closest("li");
    expect(porscheCard).not.toBeNull();
    expect(fordCard).not.toBeNull();

    await user.click(
      porscheCard!.querySelector('button[aria-label="Add to compare"]') as HTMLButtonElement,
    );
    expect(screen.getByLabelText("Compare selection")).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1\/2\)/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(COMPARE_SELECTION_KEY)).toContain('"id":9');
    expect(
      porscheCard!.querySelector('button[aria-label="Remove from compare"]'),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      fordCard!.querySelector('button[aria-label="Add to compare"]') as HTMLButtonElement,
    );
    expect(screen.getByText(/Compare \(2\/2\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Side by side" })).toHaveAttribute(
      "href",
      "/compare?a=9&b=10",
    );
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Owned" })).toBeInTheDocument();
  });

  it("copies the public garage link with a toast", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
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

    await user.click(await screen.findByRole("button", { name: "Copy garage link" }));
    expect(copyTextToClipboard).toHaveBeenCalled();
    const copied = vi.mocked(copyTextToClipboard).mock.calls[0]?.[0] ?? "";
    expect(copied).toMatch(/\/members\/2$/);
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
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

  it("searches owned and for-sale by make/model and keeps sort in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/garage"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/garage"
                element={
                  <>
                    <GaragePage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a car" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search garage by make or model/i,
    });
    await user.clear(input);
    await user.type(input, "ford");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("garage-params").textContent).toContain("q=ford");
    });
    expect(screen.getByRole("link", { name: /Ford Focus ST/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Porsche 911/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Audi RS3/i })).not.toBeInTheDocument();

    const sort = screen.getByRole("combobox", { name: /Sort Owned and For sale cars/i });
    await user.selectOptions(sort, "name_asc");
    await waitFor(() => {
      const text = screen.getByTestId("garage-params").textContent ?? "";
      expect(text).toContain("q=ford");
      expect(text).toContain("sort=name_asc");
    });
  });

  it("hides the bay value strip when the garage is empty", async () => {
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 0,
      showcaseListingId: null,
      cars: [],
    });

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

    expect(await screen.findByRole("status", { name: /Empty garage bay/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Garage bay value" })).not.toBeInTheDocument();
  });

  it("shows empty bay CTAs when the garage has no cars", async () => {
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 0,
      showcaseListingId: null,
      cars: [],
    });

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

    const empty = await screen.findByRole("status", { name: /Empty garage bay/i });
    expect(empty).toBeInTheDocument();
    expect(empty.querySelector('a[href="/cars"]')?.textContent).toMatch(/Browse cars/);
    expect(empty.querySelector('a[href="/favourites"]')?.textContent).toMatch(/Favourites/);
    expect(screen.queryByRole("heading", { name: "Find a car" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sort the bay")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Owned" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "For sale" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Purchases" })).toBeInTheDocument();
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/garage?q=zzzz&sort=name_asc"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/garage"
                element={
                  <>
                    <GaragePage />
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
    const empty = screen.getByLabelText("No matching garage cars");
    expect(empty).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a car" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Owned" })).not.toBeInTheDocument();
    // Showcase / copy garage stay available in the header when cars exist.
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();

    const emptyClear = clearButtons.find((btn) => empty.contains(btn)) ?? clearButtons[0]!;
    await user.click(emptyClear);
    await waitFor(() => {
      expect(screen.getByTestId("garage-params").textContent).toBe("");
    });
  });

  it("updates paint on a for-sale car without unlisting", async () => {
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

    expect(await screen.findByRole("heading", { name: "For sale" })).toBeInTheDocument();
    const paint = screen.getByRole("combobox", { name: /Paint colour for Ford Focus/i });
    const updatePaint = screen.getByRole("button", { name: /Update paint for Ford Focus/i });
    expect(updatePaint).toBeDisabled();

    await user.selectOptions(paint, "Laser Blue");
    expect(paint).toHaveValue("Laser Blue");
    expect(updatePaint).toBeEnabled();

    const focusCard = paint.closest("li");
    expect(focusCard).not.toBeNull();
    const previewImgs = (focusCard as HTMLElement).querySelectorAll("img");
    expect(
      [...previewImgs].some((img) => (img.getAttribute("src") ?? "").includes("paintDescription=Blue")),
    ).toBe(true);

    await user.click(updatePaint);
    await waitFor(() => {
      expect(api.updateListingPaint).toHaveBeenCalledWith(10, "Laser Blue");
    });
    expect(api.unlistListing).not.toHaveBeenCalled();
    expect(api.sellListing).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Updated paint to Laser Blue — still for sale/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("button", { name: "Unlist" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Sell price presets for Ford Focus/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Garage bay value" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Top Trumps peek").length).toBeGreaterThanOrEqual(1);
  });

  it("fills the sell price from quick preset chips and still accepts free-form", async () => {
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

    expect(await screen.findByRole("heading", { name: "Owned" })).toBeInTheDocument();
    const presets = screen.getByRole("group", { name: /Sell price presets for Porsche 911/i });
    const chip250 = within(presets).getByRole("button", { name: "250 BC" });
    await user.click(chip250);

    const priceInput = screen.getByRole("spinbutton", {
      name: /Brad Coin price for Porsche 911/i,
    });
    expect(priceInput).toHaveValue(250);
    expect(chip250).toHaveAttribute("aria-pressed", "true");
    expect(within(presets).getByRole("button", { name: "50 BC" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.clear(priceInput);
    await user.type(priceInput, "333");
    expect(priceInput).toHaveValue(333);
    expect(chip250).toHaveAttribute("aria-pressed", "false");

    await user.click(within(presets).getByRole("button", { name: "100 BC" }));
    expect(priceInput).toHaveValue(100);
    const listForm = priceInput.closest("form");
    expect(listForm).not.toBeNull();
    const paint = within(listForm as HTMLElement).getByRole("combobox", {
      name: /Paint colour for Porsche 911/i,
    });
    await user.selectOptions(paint, "Laser Blue");
    expect(paint).toHaveValue("Laser Blue");
    const previewImgs = (listForm as HTMLElement).querySelectorAll("img");
    expect(
      [...previewImgs].some((img) => (img.getAttribute("src") ?? "").includes("paintDescription=Blue")),
    ).toBe(true);
    await user.click(within(listForm as HTMLElement).getByRole("button", { name: "List for sale" }));

    await waitFor(() => {
      expect(api.sellListing).toHaveBeenCalledWith(9, 100, "Laser Blue");
    });
  });

  it("keeps empty-bay Browse cars when the garage has no cars", async () => {
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 0,
      showcaseListingId: null,
      cars: [],
    });

    render(
      <MemoryRouter initialEntries={["/garage?q=zzzz"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/garage" element={<GaragePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("status", { name: /Empty garage bay/i })).toBeInTheDocument();
    expect(screen.getByText("Empty bay")).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Find a car" })).not.toBeInTheDocument();
  });
});
