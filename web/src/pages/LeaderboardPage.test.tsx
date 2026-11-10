import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { LeaderboardPage } from "./LeaderboardPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchLeaderboard: vi.fn(),
}));

import * as api from "../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="leaderboard-params">{params.toString()}</div>;
}

describe("LeaderboardPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchLeaderboard).mockResolvedValue({
      weeklyCup: {
        timezone: "Europe/London",
        weekKey: "2026-W46",
        weekStart: "2026-11-09T00:00:00.000Z",
        weekEnd: "2026-11-16T00:00:00.000Z",
        prizeAmount: 50,
        standings: [
          { userId: 7, displayName: "Bay Friend", wins: 3, rank: 1 },
          { userId: 2, displayName: "Member", wins: 1, rank: 2 },
        ],
        previousAward: {
          weekKey: "2026-W45",
          winnerUserId: 7,
          displayName: "Bay Friend",
          wins: 4,
          prizeAmount: 50,
          alreadyAwarded: true,
        },
      },
      entries: [
        {
          rank: 1,
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay and loves a fair trade on weekends.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 1025,
          topTrumpsWins: 3,
          highlightCar: {
            id: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
            bodyType: "Coupe",
            colour: "Racing Red",
            coinPrice: 420,
          },
        },
        {
          rank: 2,
          id: 2,
          displayName: "Member",
          bio: null,
          role: "member",
          roleLabel: "Member",
          coinBalance: 500,
          topTrumpsWins: 0,
          highlightCar: null,
        },
        {
          rank: 3,
          id: 9,
          displayName: "Casey Apex",
          bio: null,
          role: "member",
          roleLabel: "Member",
          coinBalance: 400,
          topTrumpsWins: 1,
          highlightCar: {
            id: 55,
            make: "Ford",
            model: "Focus",
            trimName: "ST",
            bodyType: "Hatchback",
            colour: "Blue",
            coinPrice: 180,
          },
        },
      ],
    });
  });

  it("shows bay hierarchy, podium flair, photo rows, and garage links", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LeaderboardPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Brad Coin leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(document.querySelector(".play-bay-glow")).not.toBeNull();
    expect(await screen.findByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /This week.?s cup standings/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Europe\/London/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2026-W46 · \+50 BC prize/i)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
    const cupStandings = screen.getByLabelText("This week Top Trumps cup standings");
    expect(cupStandings).toBeInTheDocument();
    expect(cupStandings).toHaveTextContent(/Bay Friend/);
    expect(cupStandings).toHaveTextContent(/3 wins/);
    expect(screen.getByLabelText("Top three on the podium")).toBeInTheDocument();
    expect(screen.getByText("All-time podium")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "All-time standings" })).toBeInTheDocument();

    const garageLink = await screen.findByRole("link", {
      name: /Bay Friend, rank 1, open garage/i,
    });
    expect(garageLink).toHaveAttribute("href", "/members/7");
    expect(garageLink).toHaveTextContent("1,025 BC");
    expect(garageLink).toHaveTextContent("3 Top Trumps wins");
    expect(garageLink).toHaveTextContent(/Collects pace/i);

    const img = garageLink.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    const selfLink = screen.getByRole("link", { name: /Member \(you\), rank 2, open garage/i });
    expect(selfLink).toHaveAttribute("href", "/members/2");
    expect(selfLink).toHaveTextContent("Empty bay");
    expect(selfLink).toHaveTextContent("You");
    expect(screen.getByText("Your rank #2")).toBeInTheDocument();
    const yourRow = document.getElementById("leaderboard-your-rank");
    expect(yourRow).not.toBeNull();
    expect(yourRow).toHaveAttribute("aria-current", "true");

    const standings = screen.getByRole("heading", { name: "All-time standings" }).closest("section");
    expect(standings).not.toBeNull();
    const standingsChallenges = standings!.querySelectorAll(
      'a[aria-label^="Challenge "][href^="/play?opponent="]',
    );
    expect([...standingsChallenges].map((a) => a.getAttribute("href"))).toEqual([
      "/play?opponent=7",
      "/play?opponent=9",
    ]);
    const standingsTrades = standings!.querySelectorAll(
      'a[aria-label^="Offer trade with "][href^="/trades?with="]',
    );
    expect([...standingsTrades].map((a) => a.getAttribute("href"))).toEqual([
      "/trades?with=7",
      "/trades?with=9",
    ]);
    expect(
      screen.queryByRole("link", { name: /Challenge Member to Top Trumps/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Offer trade with Member/i }),
    ).not.toBeInTheDocument();
  });

  it("offers Jump to my rank when the signed-in row is off-screen", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    type ObserverCallback = IntersectionObserverCallback;
    let observerCb: ObserverCallback | null = null;
    const observe = vi.fn();
    const disconnect = vi.fn();
    const OriginalIO = window.IntersectionObserver;
    window.IntersectionObserver = class {
      constructor(cb: ObserverCallback) {
        observerCb = cb;
      }
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      takeRecords = () => [];
      root = null;
      rootMargin = "";
      thresholds = [];
    } as typeof IntersectionObserver;

    try {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LeaderboardPage />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole("link", { name: /Member \(you\), rank 2, open garage/i }),
      ).toBeInTheDocument();
      expect(observe).toHaveBeenCalled();
      expect(observerCb).not.toBeNull();

      const target = document.getElementById("leaderboard-your-rank");
      expect(target).not.toBeNull();
      observerCb!(
        [
          {
            isIntersecting: false,
            target: target!,
            intersectionRatio: 0,
            boundingClientRect: target!.getBoundingClientRect(),
            intersectionRect: target!.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      );

      const jump = await screen.findByRole("button", {
        name: /Jump to my rank, currently #2/i,
      });
      expect(jump).toHaveTextContent("Jump to my rank");
      expect(jump).toHaveTextContent("#2");
      await user.click(jump);
      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled();
      });
    } finally {
      Element.prototype.scrollIntoView = originalScroll;
      window.IntersectionObserver = OriginalIO;
    }
  });

  it("shows Jump to my rank when Find filters hide the signed-in row", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(
        <MemoryRouter initialEntries={["/leaderboard?q=casey"]}>
          <AuthProvider>
            <Routes>
              <Route
                path="/leaderboard"
                element={
                  <>
                    <LeaderboardPage />
                    <SearchParamsProbe />
                  </>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole("link", { name: /Casey Apex, rank 3, open garage/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Member \(you\), rank 2, open garage/i }),
      ).not.toBeInTheDocument();
      const jump = screen.getByRole("button", { name: /Jump to my rank, currently #2/i });
      await user.click(jump);
      await waitFor(() => {
        expect(screen.getByTestId("leaderboard-params").textContent).not.toContain("q=");
      });
      expect(
        await screen.findByRole("link", { name: /Member \(you\), rank 2, open garage/i }),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled();
      });
    } finally {
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it("deep-links Challenge and Offer trade from standings and cup for other members", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LeaderboardPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: /Bay Friend, rank 1, open garage/i }),
    ).toBeInTheDocument();

    const standings = screen.getByRole("heading", { name: "All-time standings" }).closest("section");
    expect(standings).not.toBeNull();
    const standingsChallenge = standings!.querySelector('a[href="/play?opponent=7"]');
    expect(standingsChallenge).not.toBeNull();
    expect(standingsChallenge).toHaveAttribute(
      "aria-label",
      "Challenge Bay Friend to Top Trumps",
    );
    expect(standingsChallenge).toHaveTextContent("Challenge to Top Trumps");
    const standingsTrade = standings!.querySelector('a[href="/trades?with=7"]');
    expect(standingsTrade).not.toBeNull();
    expect(standingsTrade).toHaveAttribute("aria-label", "Offer trade with Bay Friend");
    expect(standingsTrade).toHaveTextContent("Offer trade");

    const cupStandings = screen.getByLabelText("This week Top Trumps cup standings");
    const cupChallenge = cupStandings.querySelector('a[href="/play?opponent=7"]');
    expect(cupChallenge).not.toBeNull();
    expect(cupChallenge).toHaveAttribute(
      "aria-label",
      "Challenge Bay Friend to Top Trumps",
    );
    const cupTrade = cupStandings.querySelector('a[href="/trades?with=7"]');
    expect(cupTrade).not.toBeNull();
    expect(cupTrade).toHaveAttribute("aria-label", "Offer trade with Bay Friend");
    expect(cupStandings.querySelector('a[href="/play?opponent=2"]')).toBeNull();
    expect(cupStandings.querySelector('a[href="/trades?with=2"]')).toBeNull();
    expect(standings!.querySelector('a[href="/play?opponent=2"]')).toBeNull();
    expect(standings!.querySelector('a[href="/trades?with=2"]')).toBeNull();
  });

  it("searches standings by display name and keeps the podium", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/leaderboard"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/leaderboard"
              element={
                <>
                  <LeaderboardPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Casey Apex, rank 3, open garage/i }),
    ).toBeInTheDocument();

    const input = screen.getByRole("searchbox", {
      name: /Search leaderboard by display name/i,
    });
    await user.clear(input);
    await user.type(input, "casey");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByTestId("leaderboard-params").textContent).toContain("q=casey");
    });
    expect(
      screen.getByRole("link", { name: /Casey Apex, rank 3, open garage/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Bay Friend, rank 1, open garage/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Top three on the podium")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(clearButtons[0]!);
    await waitFor(() => {
      expect(screen.getByTestId("leaderboard-params").textContent).not.toContain("q=");
    });
    expect(
      await screen.findByRole("link", { name: /Bay Friend, rank 1, open garage/i }),
    ).toBeInTheDocument();
  });

  it("shows No matches and Clear filters when Find yields none", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/leaderboard?q=zzzz"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/leaderboard"
              element={
                <>
                  <LeaderboardPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching leaderboard members")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find a member" })).toBeInTheDocument();
    expect(screen.getByLabelText("Top three on the podium")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(clearButtons[clearButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByTestId("leaderboard-params").textContent).toBe("");
    });
    expect(
      await screen.findByRole("link", { name: /Bay Friend, rank 1, open garage/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
