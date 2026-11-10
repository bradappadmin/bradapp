import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { COMPARE_SELECTION_KEY } from "../compare-selection";
import { FavouritesPage } from "./FavouritesPage";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="favourites-params">{params.toString()}</div>;
}

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchFavouriteCount: vi.fn().mockResolvedValue({ count: 0 }),
  fetchFavourites: vi.fn(),
}));

import * as api from "../api";

const audi = {
  id: 11,
  make: "Audi",
  model: "RS6",
  trimName: "Avant",
  bodyType: "Estate",
  bhp: 591,
  topSpeedMph: 155,
  zeroToSixtySecs: 3.6,
  conditionType: "used" as const,
  year: 2019,
  colour: "Nardo Grey",
  mileage: 18000,
  coinPrice: 310,
  status: "available" as const,
  ownerUserId: 177,
  ownerLabel: "Sam Bay",
  garageName: "Bay",
  garageCity: "London",
  favouritedAt: "2026-11-09T12:00:00.000Z",
};

const porsche = {
  ...audi,
  id: 9,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  bodyType: "Coupe",
  colour: "Racing Red",
  coinPrice: 420,
  ownerUserId: 177,
  favouritedAt: "2026-11-09T12:05:00.000Z",
};

const ownCar = {
  ...audi,
  id: 22,
  make: "Ford",
  model: "Focus",
  trimName: "ST",
  ownerUserId: 2,
  ownerLabel: "You",
  favouritedAt: "2026-11-09T12:10:00.000Z",
};

const stockCar = {
  ...audi,
  id: 33,
  make: "Toyota",
  model: "GR Yaris",
  trimName: "Circuit",
  ownerUserId: null,
  ownerLabel: "Bay stock",
  favouritedAt: "2026-11-09T12:15:00.000Z",
};

describe("FavouritesPage Midnight Garage UI", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.removeItem(COMPARE_SELECTION_KEY);
  });

  beforeEach(() => {
    window.sessionStorage.removeItem(COMPARE_SELECTION_KEY);
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
    vi.mocked(api.fetchFavourites).mockResolvedValue({
      cars: [audi],
    });
  });

  it("shows bay hierarchy and photo-first media cards", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <FavouritesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Favourites" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(await screen.findByRole("heading", { name: "Saved" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Audi RS6 Avant/i })).toHaveAttribute(
      "href",
      "/cars/11",
    );
    const browseLinks = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browseLinks.some((link) => link.getAttribute("href") === "/cars")).toBe(true);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("shows a clear empty state with Cars CTA", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [] });

    render(
      <MemoryRouter>
        <AuthProvider>
          <FavouritesPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No favourites yet")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    const cta = screen.getAllByRole("link", { name: "Browse cars" });
    expect(cta.some((link) => link.className.includes("bay-cta"))).toBe(true);
    expect(screen.queryByRole("heading", { name: "Saved" })).not.toBeInTheDocument();
  });

  it("enables Compare these only after selecting exactly two favourites", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [audi, porsche] });

    render(
      <MemoryRouter initialEntries={["/favourites"]}>
        <AuthProvider>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Compare favourites")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare these" })).toBeDisabled();

    const boxes = await screen.findAllByRole("checkbox", { name: /Select for compare/i });
    expect(boxes).toHaveLength(2);
    await user.click(boxes[0]!);
    expect(screen.getByRole("button", { name: "Compare these" })).toBeDisabled();
    expect(screen.getByText(/1\/2/)).toBeInTheDocument();

    await user.click(boxes[1]!);
    const compareLink = await screen.findByRole("link", { name: "Compare these" });
    expect(compareLink.getAttribute("href")).toMatch(/^\/compare\?a=\d+&b=\d+$/);
    expect(compareLink.getAttribute("href")).toContain("11");
    expect(compareLink.getAttribute("href")).toContain("9");
  });

  it("sorts the Saved grid via Sort the bay and persists sort in the URL", async () => {
    const user = userEvent.setup();
    const ford = {
      ...audi,
      id: 3,
      make: "Ford",
      model: "Focus",
      trimName: "ST",
      coinPrice: 80,
    };
    vi.mocked(api.fetchFavourites).mockResolvedValue({
      cars: [audi, porsche, ford],
    });

    render(
      <MemoryRouter initialEntries={["/favourites"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/favourites"
              element={
                <>
                  <FavouritesPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sort the bay")).toBeInTheDocument();
    const sort = screen.getByRole("combobox", { name: /Sort saved favourite cars/i });
    expect(sort).toHaveValue("value_desc");

    const saved = screen.getByRole("heading", { name: "Saved" }).closest("section");
    expect(saved).not.toBeNull();
    let links = saved!.querySelectorAll("a[href^='/cars/']");
    expect(links[0]?.textContent).toMatch(/Porsche 911/i);
    expect(links[1]?.textContent).toMatch(/Audi RS6/i);

    await user.selectOptions(sort, "name_asc");
    expect(sort).toHaveValue("name_asc");
    await waitFor(() => {
      expect(screen.getByTestId("favourites-params").textContent).toContain("sort=name_asc");
    });
    links = saved!.querySelectorAll("a[href^='/cars/']");
    expect(links[0]?.textContent).toMatch(/Audi RS6/i);
    expect(links[1]?.textContent).toMatch(/Ford Focus/i);
    expect(links[2]?.textContent).toMatch(/Porsche 911/i);
  });

  it("reads sort from the URL on load", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [audi, porsche] });

    render(
      <MemoryRouter initialEntries={["/favourites?sort=value_asc"]}>
        <AuthProvider>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const sort = await screen.findByRole("combobox", {
      name: /Sort saved favourite cars/i,
    });
    expect(sort).toHaveValue("value_asc");
    const saved = screen.getByRole("heading", { name: "Saved" }).closest("section");
    const links = saved!.querySelectorAll("a[href^='/cars/']");
    expect(links[0]?.textContent).toMatch(/Audi RS6/i);
    expect(links[1]?.textContent).toMatch(/Porsche 911/i);
  });

  it("searches favourites by make/model and keeps sort in the URL", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [audi, porsche] });

    render(
      <MemoryRouter initialEntries={["/favourites"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/favourites"
              element={
                <>
                  <FavouritesPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a favourite" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getByText("Compare favourites")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search favourites by make or model/i,
    });
    await user.clear(input);
    await user.type(input, "porsche");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("favourites-params").textContent).toContain("q=porsche");
    });
    expect(screen.getByRole("link", { name: /Porsche 911/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Audi RS6/i })).not.toBeInTheDocument();

    const sort = screen.getByRole("combobox", { name: /Sort saved favourite cars/i });
    await user.selectOptions(sort, "name_asc");
    await waitFor(() => {
      const text = screen.getByTestId("favourites-params").textContent ?? "";
      expect(text).toContain("q=porsche");
      expect(text).toContain("sort=name_asc");
    });
  });

  it("shows empty search state", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [audi, porsche] });

    render(
      <MemoryRouter initialEntries={["/favourites?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
  });

  it("offers trade on someone else’s favourite and hides it for own/stock cars", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({
      cars: [audi, ownCar, stockCar],
    });

    render(
      <MemoryRouter initialEntries={["/favourites"]}>
        <AuthProvider>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Saved" })).toBeInTheDocument();
    const offer = screen.getByRole("link", { name: "Offer trade" });
    expect(offer).toHaveAttribute("href", "/trades?with=177&theirCar=11");
    expect(screen.getByRole("link", { name: /Audi RS6/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ford Focus/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Toyota GR Yaris/i })).toBeInTheDocument();
    // Only one Offer trade — own + bay stock stay hidden.
    expect(screen.getAllByRole("link", { name: "Offer trade" })).toHaveLength(1);
    expect(screen.getByText("Find a favourite")).toBeInTheDocument();
    expect(screen.getByText("Compare favourites")).toBeInTheDocument();
  });
});
