import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { TradeHistoryPage } from "./TradeHistoryPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchCompletedTrades: vi.fn(),
}));

import * as api from "../api";

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="trades-history-params">{params.toString()}</div>;
}

describe("TradeHistoryPage Midnight Garage UI", () => {
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
        coinBalance: 400,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 400,
      },
    });
    vi.mocked(api.fetchCompletedTrades).mockResolvedValue({
      trades: [
        {
          id: 5,
          status: "accepted",
          resolvedAt: "2026-11-09T20:00:00.000Z",
          counterpartyName: "Sam Bay",
          counterpartyUserId: 177,
          theirCarListingId: 42,
          theirCarAvailable: true,
          youWere: "offerer",
          youGave: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
          },
          youGot: {
            listingId: 9,
            make: "BMW",
            model: "M3",
            trimName: "Competition",
          },
        },
        {
          id: 4,
          status: "accepted",
          resolvedAt: "2026-11-08T18:00:00.000Z",
          counterpartyName: "Casey Apex",
          counterpartyUserId: 88,
          theirCarListingId: 11,
          theirCarAvailable: false,
          youWere: "receiver",
          youGave: {
            listingId: 11,
            make: "Audi",
            model: "RS6",
            trimName: "Avant",
          },
          youGot: {
            listingId: 15,
            make: "Ford",
            model: "Mustang",
            trimName: "GT",
          },
        },
        {
          id: 3,
          status: "declined",
          resolvedAt: "2026-11-07T12:00:00.000Z",
          counterpartyName: "Bay Friend",
          counterpartyUserId: 55,
          theirCarListingId: 20,
          theirCarAvailable: false,
          youWere: "offerer",
          youGave: {
            listingId: 20,
            make: "Toyota",
            model: "GR86",
            trimName: "",
          },
          youGot: {
            listingId: 21,
            make: "Mazda",
            model: "MX-5",
            trimName: "RF",
          },
        },
      ],
    });
  });

  it("shows bay hierarchy and Offer again deep-links for the other party", async () => {
    render(
      <MemoryRouter initialEntries={["/trades/history"]}>
        <AuthProvider>
          <TradeHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Trade history" })).toBeInTheDocument();
    expect(screen.getByText(/Free card trades · Midnight garage/i)).toBeInTheDocument();
    expect(await screen.findByLabelText("Trade history summary")).toHaveTextContent(
      /2 completed/i,
    );
    expect(screen.getByLabelText("Trade history summary")).toHaveTextContent(/1 declined/i);
    expect(screen.getByRole("heading", { name: "Filter status" })).toBeInTheDocument();

    expect(screen.getByText(/with Sam Bay/i)).toBeInTheDocument();
    expect(screen.getAllByText(/You offered/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Declined").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/with Bay Friend/i)).toBeInTheDocument();

    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    expect(screen.getByRole("link", { name: /Back to Trades/i })).toHaveAttribute(
      "href",
      "/trades",
    );
    expect(screen.getByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );

    expect(screen.getByRole("link", { name: "Offer again with Sam Bay" })).toHaveAttribute(
      "href",
      "/trades?with=177&theirCar=42",
    );
    expect(screen.getByRole("link", { name: "Offer again with Casey Apex" })).toHaveAttribute(
      "href",
      "/trades?with=88",
    );
    expect(screen.getByRole("link", { name: "Offer again with Bay Friend" })).toHaveAttribute(
      "href",
      "/trades?with=55",
    );
    expect(screen.queryByRole("button", { name: /Offer again|Trade again/i })).not.toBeInTheDocument();
  });

  it("hides Offer again when the counterparty is the viewer", async () => {
    vi.mocked(api.fetchCompletedTrades).mockResolvedValue({
      trades: [
        {
          id: 9,
          status: "accepted",
          resolvedAt: "2026-11-09T20:00:00.000Z",
          counterpartyName: "Member",
          counterpartyUserId: 2,
          theirCarListingId: 42,
          theirCarAvailable: true,
          youWere: "offerer",
          youGave: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
          },
          youGot: {
            listingId: 9,
            make: "BMW",
            model: "M3",
            trimName: "Competition",
          },
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades/history"]}>
        <AuthProvider>
          <TradeHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/with Member/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Offer again/i })).not.toBeInTheDocument();
  });

  it("filters completed and declined with status chips in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/trades/history"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/trades/history"
              element={
                <>
                  <TradeHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/with Sam Bay/i)).toBeInTheDocument();
    expect(screen.getByText(/with Bay Friend/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Completed" }));
    await waitFor(() => {
      expect(screen.getByTestId("trades-history-params").textContent).toContain(
        "status=completed",
      );
    });
    expect(screen.getByText(/with Sam Bay/i)).toBeInTheDocument();
    expect(screen.queryByText(/with Bay Friend/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offer again with Sam Bay" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Declined" }));
    await waitFor(() => {
      expect(screen.getByTestId("trades-history-params").textContent).toContain(
        "status=declined",
      );
    });
    expect(screen.getByText(/with Bay Friend/i)).toBeInTheDocument();
    expect(screen.queryByText(/with Sam Bay/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offer again with Bay Friend" })).toBeInTheDocument();
  });

  it("shows Empty bay with Open trades and Browse members when there is no history", async () => {
    vi.mocked(api.fetchCompletedTrades).mockResolvedValue({ trades: [] });

    render(
      <MemoryRouter initialEntries={["/trades/history"]}>
        <AuthProvider>
          <TradeHistoryPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empty bay")).toBeInTheDocument();
    const empty = screen.getByLabelText("Empty trade history bay");
    expect(empty).toBeInTheDocument();
    expect(empty.querySelector('a[href="/trades"]')?.textContent).toMatch(/Open trades/i);
    expect(empty.querySelector('a[href="/members"]')?.textContent).toMatch(/Browse members/i);
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Filter status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Offer again/i })).not.toBeInTheDocument();
  });

  it("shows No matches and Clear filter when Completed/Declined yields none", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchCompletedTrades).mockResolvedValue({
      trades: [
        {
          id: 5,
          status: "accepted",
          resolvedAt: "2026-11-09T20:00:00.000Z",
          counterpartyName: "Sam Bay",
          counterpartyUserId: 177,
          theirCarListingId: 42,
          theirCarAvailable: true,
          youWere: "offerer",
          youGave: {
            listingId: 42,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
          },
          youGot: {
            listingId: 9,
            make: "BMW",
            model: "M3",
            trimName: "Competition",
          },
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades/history?status=declined"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/trades/history"
              element={
                <>
                  <TradeHistoryPage />
                  <SearchParamsProbe />
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No matches")).toBeInTheDocument();
    const emptyFilter = screen.getByLabelText("No matching trade history");
    expect(emptyFilter).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter status" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filter" })).toBeInTheDocument();
    expect(emptyFilter.querySelector('a[href="/trades"]')?.textContent).toMatch(/Open trades/i);
    expect(emptyFilter.querySelector('a[href="/members"]')?.textContent).toMatch(
      /Browse members/i,
    );
    expect(screen.queryByRole("link", { name: /Offer again/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    await waitFor(() => {
      expect(screen.getByTestId("trades-history-params").textContent).toBe("");
    });
    expect(screen.getByText(/with Sam Bay/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offer again with Sam Bay" })).toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });
});
