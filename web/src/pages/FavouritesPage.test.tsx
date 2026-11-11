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
    expect(screen.getByRole("region", { name: "Favourites bay value" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Favourites value 310 BC/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 favourite saved")).toBeInTheDocument();
    expect(screen.getByText(/Top Trumps peek under the studio photo/i)).toBeInTheDocument();
    expect(screen.getByText("Top Trumps peek")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Audi RS6 Avant/i })).toHaveAttribute(
      "href",
      "/cars/11",
    );
    const peek = screen.getByLabelText("Top Trumps peek");
    expect(peek).toBeInTheDocument();
    expect(peek.textContent).toMatch(/Power/);
    expect(peek.textContent).toMatch(/0–60/);
    expect(peek.textContent).toMatch(/Top speed/);
    expect(screen.getByText("591")).toBeInTheDocument();
    expect(screen.getByText("3.6s")).toBeInTheDocument();
    expect(screen.getByText("155 mph")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to compare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge to Top Trumps" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offer trade" })).toBeInTheDocument();
    const browseLinks = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browseLinks.some((link) => link.getAttribute("href") === "/cars")).toBe(true);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toMatch(/data:image\/svg\+xml/);
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
    expect(screen.queryByRole("region", { name: "Favourites bay value" })).not.toBeInTheDocument();
  });

  it("queues Favourites cards into the shared compare tray", async () => {
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

    expect(await screen.findByRole("heading", { name: "Saved" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Compare selection")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add to compare" })).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Compare" }).some((a) => a.getAttribute("href") === "/compare"),
    ).toBe(true);

    await user.click(screen.getAllByRole("button", { name: "Add to compare" })[0]!);
    expect(screen.getByLabelText("Compare selection")).toBeInTheDocument();
    expect(screen.getByText(/Compare \(1\/2\)/i)).toBeInTheDocument();
    // Default sort is Highest price → Porsche (9) then Audi (11).
    expect(sessionStorage.getItem(COMPARE_SELECTION_KEY)).toContain('"id":9');
    expect(screen.getByRole("button", { name: "Remove from compare" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getAllByRole("button", { name: "Add to compare" })[0]!);
    expect(screen.getByText(/Compare \(2\/2\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Side by side" })).toHaveAttribute(
      "href",
      "/compare?a=9&b=11",
    );
    // Search / sort / Offer trade stay while compare tray is active.
    expect(screen.getByRole("heading", { name: "Find a favourite" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Offer trade" }).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("link", { name: "Challenge to Top Trumps" }).length,
    ).toBeGreaterThanOrEqual(1);
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
    expect(screen.getAllByRole("button", { name: "Add to compare" }).length).toBeGreaterThanOrEqual(1);

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

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [audi, porsche] });

    render(
      <MemoryRouter initialEntries={["/favourites?q=zzzz&sort=name_asc"]}>
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

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    const empty = screen.getByLabelText("No matching favourites");
    expect(empty).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Find a favourite" })).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to compare" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Saved" })).not.toBeInTheDocument();

    const emptyClear = clearButtons.find((btn) => empty.contains(btn)) ?? clearButtons[0]!;
    await user.click(emptyClear);
    await waitFor(() => {
      expect(screen.getByTestId("favourites-params").textContent).toBe("");
    });
  });

  it("keeps Browse cars empty bay when there are no favourites", async () => {
    vi.mocked(api.fetchFavourites).mockResolvedValue({ cars: [] });

    render(
      <MemoryRouter initialEntries={["/favourites?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No favourites yet")).toBeInTheDocument();
    const browse = screen.getAllByRole("link", { name: "Browse cars" });
    expect(browse.some((link) => link.getAttribute("href") === "/cars")).toBe(true);
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Find a favourite" })).not.toBeInTheDocument();
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
    expect(screen.getAllByRole("button", { name: "Add to compare" })).toHaveLength(3);
  });

  it("challenges Top Trumps on someone else’s favourite and hides it for own/stock cars", async () => {
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
    const challenge = screen.getByRole("link", { name: "Challenge to Top Trumps" });
    expect(challenge).toHaveAttribute("href", "/play?opponent=177&theirCar=11");
    expect(screen.getByRole("link", { name: "Offer trade" })).toHaveAttribute(
      "href",
      "/trades?with=177&theirCar=11",
    );
    // Own + bay stock hide both product CTAs.
    expect(screen.getAllByRole("link", { name: "Challenge to Top Trumps" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Offer trade" })).toHaveLength(1);
    expect(screen.getByText("Find a favourite")).toBeInTheDocument();
    expect(screen.getByText("Sort the bay")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add to compare" })).toHaveLength(3);
  });
});
