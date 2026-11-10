import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { ToastProvider } from "../toast-context";
import { MemberProfilePage } from "./MemberProfilePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchMemberProfile: vi.fn(),
  setGarageShowcase: vi.fn(),
  giftBradCoins: vi.fn(),
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

const porsche = {
  id: 42,
  make: "Porsche",
  model: "911",
  trimName: "GT3",
  bodyType: "Coupe",
  bhp: 502,
  topSpeedMph: 197,
  zeroToSixtySecs: 3.2,
  year: 2022,
  colour: "Racing Red",
  status: "owned",
  coinPrice: 420,
};

const audi = {
  id: 11,
  make: "Audi",
  model: "RS3",
  trimName: "Vorsprung",
  bodyType: "Saloon",
  bhp: 400,
  topSpeedMph: 155,
  zeroToSixtySecs: 3.8,
  year: 2021,
  colour: "Nardo Grey",
  status: "owned",
  coinPrice: 520,
};

describe("MemberProfilePage showcase garage", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(copyTextToClipboard).mockReset();
  });

  beforeEach(() => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 2,
        email: "viewer@example.com",
        displayName: "Viewer",
        bio: null,
        role: "member",
        coinBalance: 200,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 200,
      },
    });
    vi.mocked(api.setGarageShowcase).mockResolvedValue({ ok: true, showcaseListingId: 42 });
    vi.mocked(api.fetchMemberProfile).mockResolvedValue({
      member: {
        id: 7,
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        roleLabel: "Member",
        coinBalance: 880,
        carCount: 2,
      },
      cars: [porsche, audi],
      showcase: audi,
      showcaseSource: "highest_value",
      showcaseListingId: null,
    });
  });

  it("renders the showcase hero above photo-first garage cards", async () => {
    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay Friend" })).toBeInTheDocument();
    expect(screen.getByText("Collects pace in the family bay.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Audi RS3/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Highest-value car in the bay/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Member garage cars" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/42",
    );
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge" })).toHaveAttribute(
      "href",
      "/play?opponent=7",
    );
    expect(
      screen.getAllByRole("link", { name: "Offer trade" }).some(
        (link) => link.getAttribute("href") === "/trades?with=7&theirCar=42",
      ),
    ).toBe(true);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("copies that member's public garage link with a toast", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bay Friend" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy garage link" }));
    expect(copyTextToClipboard).toHaveBeenCalled();
    const copied = vi.mocked(copyTextToClipboard).mock.calls[0]?.[0] ?? "";
    expect(copied).toMatch(/\/members\/7$/);
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
  });

  it("lets you pin a showcase car on your own public garage", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 7,
        email: "owner@example.com",
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        coinBalance: 880,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 880,
      },
    });
    vi.mocked(api.fetchMemberProfile)
      .mockResolvedValueOnce({
        member: {
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 880,
          carCount: 2,
        },
        cars: [porsche, audi],
        showcase: audi,
        showcaseSource: "highest_value",
        showcaseListingId: null,
      })
      .mockResolvedValue({
        member: {
          id: 7,
          displayName: "Bay Friend",
          bio: "Collects pace in the family bay.",
          role: "member",
          roleLabel: "Member",
          coinBalance: 880,
          carCount: 2,
        },
        cars: [porsche, audi],
        showcase: porsche,
        showcaseSource: "pinned",
        showcaseListingId: 42,
      });

    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Bay Friend \(you\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy garage link" })).toBeInTheDocument();
    const pinButtons = screen.getAllByRole("button", { name: "Make showcase" });
    await user.click(pinButtons[0]!);
    await vi.waitFor(() => {
      expect(api.setGarageShowcase).toHaveBeenCalled();
    });
    expect((await screen.findAllByText(/Pinned showcase/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Unpin showcase" }).length).toBeGreaterThan(0);
  });

  it("lets a signed-in visitor gift Brad Coins with amount and optional note", async () => {
    const user = userEvent.setup();
    vi.mocked(api.giftBradCoins).mockResolvedValue({
      ok: true,
      amount: 40,
      senderBalance: 160,
      receiverBalance: 920,
      receiver: { id: 7, displayName: "Bay Friend", coinBalance: 920 },
    });

    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Gift coins to Bay Friend/i })).toBeInTheDocument();
    expect(document.getElementById("gift-coins")).not.toBeNull();
    expect(screen.getByText(/Play money only|No real money/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Gift amount presets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10 BC" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "25 BC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50 BC" })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Amount$/i), "40");
    await user.type(screen.getByLabelText(/Note \(optional\)/i), "Bay tip");
    await user.click(screen.getByRole("button", { name: "Send gift" }));

    await vi.waitFor(() => {
      expect(api.giftBradCoins).toHaveBeenCalledWith(7, { amount: 40, note: "Bay tip" });
    });
    expect(await screen.findByText(/Sent .* to Bay Friend/i)).toBeInTheDocument();
    expect(screen.getByText(/920 BC|920/i)).toBeInTheDocument();
  });

  it("exposes #gift-coins for Members directory Gift deep-links", async () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    render(
      <MemoryRouter initialEntries={["/members/7#gift-coins"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Gift coins to Bay Friend/i })).toBeInTheDocument();
    const section = document.getElementById("gift-coins");
    expect(section).not.toBeNull();
    await vi.waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
    Element.prototype.scrollIntoView = original;
  });

  it("fills the gift amount from quick preset chips", async () => {
    const user = userEvent.setup();
    vi.mocked(api.giftBradCoins).mockResolvedValue({
      ok: true,
      amount: 25,
      senderBalance: 175,
      receiverBalance: 905,
      receiver: { id: 7, displayName: "Bay Friend", coinBalance: 905 },
    });

    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Gift coins to Bay Friend/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "25 BC" }));
    expect(screen.getByLabelText(/^Amount$/i)).toHaveValue(25);
    expect(screen.getByRole("button", { name: "25 BC" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "10 BC" })).toHaveAttribute("aria-pressed", "false");

    await user.clear(screen.getByLabelText(/^Amount$/i));
    await user.type(screen.getByLabelText(/^Amount$/i), "18");
    expect(screen.getByRole("button", { name: "25 BC" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "50 BC" }));
    expect(screen.getByLabelText(/^Amount$/i)).toHaveValue(50);
    await user.click(screen.getByRole("button", { name: "25 BC" }));
    await user.click(screen.getByRole("button", { name: "Send gift" }));

    await vi.waitFor(() => {
      expect(api.giftBradCoins).toHaveBeenCalledWith(7, { amount: 25 });
    });
  });

  it("hides the gift form on your own garage", async () => {
    vi.mocked(api.fetchMe).mockResolvedValue({
      user: {
        id: 7,
        email: "owner@example.com",
        displayName: "Bay Friend",
        bio: "Collects pace in the family bay.",
        role: "member",
        coinBalance: 880,
      },
      dailyLogin: {
        amount: 25,
        claimDate: "2026-11-09",
        claimedToday: true,
        claimedJustNow: false,
        balance: 880,
      },
    });

    render(
      <MemoryRouter initialEntries={["/members/7"]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/members/:id" element={<MemberProfilePage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /Bay Friend \(you\)/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Gift coins/i })).not.toBeInTheDocument();
  });
});
