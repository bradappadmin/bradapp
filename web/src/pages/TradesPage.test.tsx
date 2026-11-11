import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { TradesPage } from "./TradesPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchGarage: vi.fn(),
  fetchMembers: vi.fn(),
  fetchTrades: vi.fn(),
  fetchMemberCards: vi.fn(),
  acceptTrade: vi.fn(),
  declineTrade: vi.fn(),
}));

import * as api from "../api";

describe("TradesPage Midnight Garage UI", () => {
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
    vi.mocked(api.fetchGarage).mockResolvedValue({
      totalValue: 420,
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
      ],
    });
    vi.mocked(api.fetchMembers).mockResolvedValue({
      members: [
        {
          id: 177,
          displayName: "Sam Bay",
          bio: null,
          role: "member",
          roleLabel: "Member",
          carCount: 2,
          coinBalance: 300,
        },
      ],
    });
    vi.mocked(api.fetchTrades).mockResolvedValue({ trades: [] });
    vi.mocked(api.fetchMemberCards).mockResolvedValue({ cards: [] });
  });

  it("shows bay hierarchy, inbox, compose, and history entry", async () => {
    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Card trades" })).toBeInTheDocument();
    expect(screen.getByText("Midnight garage")).toBeInTheDocument();
    expect(screen.getByText(/Free swaps/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send a free trade" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your outgoing offers" })).toBeInTheDocument();

    const history = screen.getAllByRole("link", { name: /Completed history|Full history|history/i });
    expect(history.some((link) => link.getAttribute("href") === "/trades/history")).toBe(true);

    expect(await screen.findByRole("button", { name: /Send free trade offer/i })).toBeInTheDocument();
  });

  it("shows an empty inbox bay with Members and Cars CTAs", async () => {
    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Inbox is empty")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /Empty trade inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse members" })).toHaveAttribute(
      "href",
      "/members",
    );
    expect(screen.getByRole("link", { name: "Browse cars for sale" })).toHaveAttribute(
      "href",
      "/cars",
    );
    expect(screen.getByRole("heading", { name: "Send a free trade" })).toBeInTheDocument();
    const history = screen.getAllByRole("link", { name: /Completed history|Full history|history/i });
    expect(history.some((link) => link.getAttribute("href") === "/trades/history")).toBe(true);
  });

  it("hides the empty inbox bay when a pending offer arrives", async () => {
    vi.mocked(api.fetchTrades).mockResolvedValue({
      trades: [
        {
          id: 55,
          status: "pending",
          fromUserId: 177,
          toUserId: 2,
          fromDisplayName: "Sam Bay",
          toDisplayName: "Member",
          offerListingId: 12,
          requestListingId: 9,
          offerMake: "Ford",
          offerModel: "Focus",
          offerTrimName: "ST",
          offerBodyType: "Hatchback",
          offerColour: "Racing Red",
          offerYear: 2020,
          requestMake: "Porsche",
          requestModel: "911",
          requestTrimName: "GT3",
          requestBodyType: "Coupe",
          requestColour: "Racing Red",
          requestYear: 2022,
          createdAt: "2026-11-10T00:00:00.000Z",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/wants a free swap/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    const inbox = screen.getByRole("region", { name: /Inbox/i });
    expect(inbox.querySelectorAll(".bay-rise").length).toBeGreaterThanOrEqual(1);
    expect(inbox.querySelectorAll(".car-card-media").length).toBeGreaterThanOrEqual(2);
    const studioImgs = [...inbox.querySelectorAll(".car-card-media img")];
    expect(studioImgs.length).toBeGreaterThanOrEqual(2);
    expect(
      studioImgs.some((img) => (img.getAttribute("src") ?? "").includes("data:image/svg+xml")),
    ).toBe(true);
    expect(
      studioImgs.some((img) => (img.getAttribute("src") ?? "").includes("data:image/svg+xml")),
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Open car Ford Focus ST" })).toHaveAttribute(
      "href",
      "/cars/12",
    );
    expect(screen.getByRole("link", { name: "Open car Porsche 911 GT3" })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByRole("link", { name: "Open partner Sam Bay" })).toHaveAttribute(
      "href",
      "/members/177",
    );
    expect(screen.queryByText("Inbox is empty")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /Empty trade inbox/i })).not.toBeInTheDocument();
  });

  it("links Open partner on outgoing offers and hides for self partner ids", async () => {
    vi.mocked(api.fetchTrades).mockResolvedValue({
      trades: [
        {
          id: 56,
          status: "pending",
          fromUserId: 2,
          toUserId: 177,
          fromDisplayName: "Member",
          toDisplayName: "Sam Bay",
          offerListingId: 9,
          requestListingId: 12,
          offerMake: "Porsche",
          offerModel: "911",
          offerTrimName: "GT3",
          offerBodyType: "Coupe",
          offerColour: "Racing Red",
          offerYear: 2022,
          requestMake: "Ford",
          requestModel: "Focus",
          requestTrimName: "ST",
          requestBodyType: "Hatchback",
          requestColour: "Blue",
          requestYear: 2020,
          createdAt: "2026-11-10T00:00:00.000Z",
        },
        {
          id: 57,
          status: "pending",
          fromUserId: 2,
          toUserId: 2,
          fromDisplayName: "Member",
          toDisplayName: "Member",
          offerListingId: 9,
          requestListingId: 10,
          offerMake: "Porsche",
          offerModel: "911",
          offerTrimName: "GT3",
          offerBodyType: "Coupe",
          offerColour: "Racing Red",
          offerYear: 2022,
          requestMake: "BMW",
          requestModel: "M3",
          requestTrimName: "Competition",
          requestBodyType: "Saloon",
          requestColour: "Black",
          requestYear: 2021,
          createdAt: "2026-11-10T01:00:00.000Z",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "Open partner Sam Bay" })).toHaveAttribute(
      "href",
      "/members/177",
    );
    expect(screen.queryByRole("link", { name: "Open partner Member" })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Open car Porsche 911 GT3" }).every(
        (a) => a.getAttribute("href") === "/cars/9",
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: "Open car Ford Focus ST" }).every(
        (a) => a.getAttribute("href") === "/cars/12",
      ),
    ).toBe(true);
    expect(screen.getAllByRole("button", { name: "Cancel" }).length).toBe(2);
    expect(screen.getAllByText(/Waiting on/i).length).toBe(2);
  });

  it("refreshes the pending inbox count after accepting an offer", async () => {
    const user = userEvent.setup();
    const pendingOffer = {
      id: 55,
      status: "pending" as const,
      fromUserId: 177,
      toUserId: 2,
      fromDisplayName: "Sam Bay",
      toDisplayName: "Member",
      offerListingId: 12,
      requestListingId: 9,
      offerMake: "Ford",
      offerModel: "Focus",
      offerTrimName: "ST",
      offerBodyType: "Hatchback",
      offerColour: "Racing Red",
      offerYear: 2020,
      requestMake: "Porsche",
      requestModel: "911",
      requestTrimName: "GT3",
      requestBodyType: "Coupe",
      requestColour: "Racing Red",
      requestYear: 2022,
      createdAt: "2026-11-10T00:00:00.000Z",
    };
    vi.mocked(api.fetchTrades)
      .mockResolvedValueOnce({ trades: [pendingOffer] })
      .mockResolvedValue({ trades: [] });
    vi.mocked(api.fetchTradeInboxCount)
      .mockResolvedValueOnce({ pendingIncoming: 1 })
      .mockResolvedValue({ pendingIncoming: 0 });
    vi.mocked(api.acceptTrade).mockResolvedValue({ ok: true });

    render(
      <MemoryRouter initialEntries={["/trades"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Accept" })).toBeInTheDocument();
    const inboxCallsBefore = vi.mocked(api.fetchTradeInboxCount).mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => {
      expect(api.acceptTrade).toHaveBeenCalledWith(55);
    });
    await waitFor(() => {
      expect(vi.mocked(api.fetchTradeInboxCount).mock.calls.length).toBeGreaterThan(
        inboxCallsBefore,
      );
    });
  });

  it("honours offer-trade deeplink query params in compose", async () => {
    vi.mocked(api.fetchMemberCards).mockResolvedValue({
      cards: [
        {
          id: 143,
          ownerUserId: 177,
          ownerDisplayName: "Sam Bay",
          make: "Bugatti",
          model: "Chiron",
          trimName: "Sport",
          bodyType: "Coupe",
          colour: "Arctic White",
          year: 2021,
          bhp: 1479,
          topSpeedMph: 261,
          zeroToSixtySecs: 2.3,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/trades?with=177&theirCar=143"]}>
        <AuthProvider>
          <ToastProvider>
            <TradesPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Send a free trade" })).toBeInTheDocument();
    const memberSelect = await screen.findByLabelText(/^Member$/i);
    expect(memberSelect).toHaveValue("177");
    await waitFor(() => {
      expect(screen.getByLabelText(/You request/i)).toHaveValue("143");
    });
    expect(api.fetchMemberCards).toHaveBeenCalledWith(177);
  });
});
