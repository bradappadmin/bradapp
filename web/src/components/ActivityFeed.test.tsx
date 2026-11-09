import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityFeed } from "./ActivityFeed";

vi.mock("../api", () => ({
  fetchActivity: vi.fn(),
}));

import * as api from "../api";

describe("ActivityFeed car thumbs", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchActivity).mockResolvedValue({
      items: [
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
      ],
    });
  });

  it("renders studio thumbs and display names for car events", async () => {
    render(
      <MemoryRouter>
        <ActivityFeed />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Family activity" })).toBeInTheDocument();
    expect(screen.getByText("Bay Friend")).toBeInTheDocument();
    expect(screen.getByText("Brad")).toBeInTheDocument();

    const purchase = screen.getByRole("link", { name: /Bay Friend/i });
    expect(purchase).toHaveAttribute("href", "/cars/42");
    const img = purchase.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
