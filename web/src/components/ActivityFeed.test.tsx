import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ActivityFeed,
  activityKindsForFilter,
  filterActivityItems,
} from "./ActivityFeed";
import type { ActivityItem } from "../api";

vi.mock("../api", () => ({
  fetchActivity: vi.fn(),
}));

import * as api from "../api";

const SAMPLE: ActivityItem[] = [
  {
    id: "purchase-9",
    kind: "purchase",
    createdAt: "2026-11-09T12:00:00.000Z",
    summary: "Bay Friend bought Porsche 911 for 420 BC",
    actorName: "Bay Friend",
    href: "/cars/42",
    car: {
      make: "Porsche",
      model: "911",
      trimName: "GT3",
      bodyType: "Coupe",
      colour: "Racing Red",
    },
  },
  {
    id: "trade-2",
    kind: "trade",
    createdAt: "2026-11-09T11:00:00.000Z",
    summary: "Sam traded with Jordan",
    actorName: "Sam Bay",
    href: "/trades",
    car: {
      make: "BMW",
      model: "M3",
      trimName: "Competition",
      bodyType: "Saloon",
      colour: "Midnight Black",
    },
  },
  {
    id: "play-1",
    kind: "top_trumps",
    createdAt: "2026-11-09T10:00:00.000Z",
    summary: "Casey beat the house on power",
    actorName: "Casey Apex",
    href: "/play/history",
    car: {
      make: "Audi",
      model: "RS6",
      trimName: "Avant",
      bodyType: "Estate",
      colour: "Nardo Grey",
    },
  },
  {
    id: "review-3",
    kind: "review",
    createdAt: "2026-11-08T12:00:00.000Z",
    summary: "Brad published “Bay blitz” (Audi RS6)",
    actorName: "Brad",
    href: "/reviews/3",
    car: {
      make: "Audi",
      model: "RS6",
      trimName: "Avant",
      bodyType: "Estate",
      colour: "Midnight Black",
    },
  },
  {
    id: "gift-5",
    kind: "gift",
    createdAt: "2026-11-08T11:00:00.000Z",
    summary: "Bay Friend gifted 25 BC to Sam Bay",
    actorName: "Bay Friend",
    href: "/members/12",
    car: null,
  },
];

describe("activity filter helpers", () => {
  it("maps chips to activity kinds", () => {
    expect(activityKindsForFilter("all")).toBeNull();
    expect(activityKindsForFilter("buys")).toEqual(["purchase", "sale"]);
    expect(activityKindsForFilter("trades")).toEqual(["trade"]);
    expect(activityKindsForFilter("gifts")).toEqual(["gift"]);
    expect(activityKindsForFilter("play")).toEqual(["top_trumps"]);
    expect(activityKindsForFilter("reviews")).toEqual(["review"]);
  });

  it("filters items by chip", () => {
    expect(filterActivityItems(SAMPLE, "all")).toHaveLength(5);
    expect(filterActivityItems(SAMPLE, "buys").map((i) => i.id)).toEqual(["purchase-9"]);
    expect(filterActivityItems(SAMPLE, "trades").map((i) => i.id)).toEqual(["trade-2"]);
    expect(filterActivityItems(SAMPLE, "gifts").map((i) => i.id)).toEqual(["gift-5"]);
    expect(filterActivityItems(SAMPLE, "play").map((i) => i.id)).toEqual(["play-1"]);
    expect(filterActivityItems(SAMPLE, "reviews").map((i) => i.id)).toEqual(["review-3"]);
  });
});

describe("ActivityFeed car thumbs", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchActivity).mockResolvedValue({ items: SAMPLE });
  });

  it("renders studio thumbs and display names for car events", async () => {
    render(
      <MemoryRouter>
        <ActivityFeed />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Family activity" })).toBeInTheDocument();
    expect(screen.getAllByText("Bay Friend").length).toBeGreaterThan(0);
    expect(screen.getByText("Brad")).toBeInTheDocument();

    const purchase = screen.getByRole("link", { name: /bought Porsche 911/i });
    expect(purchase).toHaveAttribute("href", "/cars/42");
    const img = purchase.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });

  it("filters the loaded feed with type chips and keeps thumbs", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ActivityFeed />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByText("Bay Friend").length).toBeGreaterThan(0);
    expect(screen.getByText("Casey Apex")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Casey Apex")).toBeInTheDocument();
    expect(screen.queryByText("Bay Friend")).not.toBeInTheDocument();
    expect(screen.queryByText("Brad")).not.toBeInTheDocument();

    const playRow = screen.getByRole("link", { name: /Casey Apex/i });
    expect(playRow.querySelector("img")?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");

    await user.click(screen.getByRole("button", { name: "Reviews" }));
    expect(screen.getByText("Brad")).toBeInTheDocument();
    expect(screen.queryByText("Casey Apex")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gifts" }));
    expect(screen.getByRole("button", { name: "Gifts" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/gifted 25 BC to Sam Bay/i)).toBeInTheDocument();
    expect(screen.queryByText("Brad")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gifted 25 BC to Sam Bay/i })).toHaveAttribute(
      "href",
      "/members/12",
    );
  });

  it("shows Empty bay Browse cars / Play / Members when the feed is empty", async () => {
    vi.mocked(api.fetchActivity).mockResolvedValue({ items: [] });

    render(
      <MemoryRouter>
        <ActivityFeed />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empty bay")).toBeInTheDocument();
    expect(screen.getByLabelText("Empty activity bay")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("href", "/members");
    expect(screen.queryByLabelText("Activity type")).not.toBeInTheDocument();
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
  });

  it("shows No matches and Clear filter when a type chip yields none", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchActivity).mockResolvedValue({
      items: SAMPLE.filter((item) => item.kind !== "gift"),
    });

    render(
      <MemoryRouter>
        <ActivityFeed />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "All" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gifts" }));

    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("No matching activity")).toBeInTheDocument();
    expect(screen.getByLabelText("Activity type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("href", "/members");

    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("No matches")).not.toBeInTheDocument();
    expect(screen.getByText("Casey Apex")).toBeInTheDocument();
  });
});
