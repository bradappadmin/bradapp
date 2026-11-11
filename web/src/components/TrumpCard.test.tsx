import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrumpCard } from "./TrumpCard";

describe("TrumpCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a studio photo frame with label and paint", () => {
    render(
      <TrumpCard
        label="You"
        highlighted
        statLabel="Power (BHP)"
        statValue={591}
        car={{
          make: "Audi",
          model: "RS6",
          trimName: "Avant",
          bodyType: "Estate",
          colour: "Racing Red",
          year: 2019,
          bhp: 591,
        }}
      />,
    );

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Audi RS6 Avant")).toBeInTheDocument();
    expect(screen.getByText(/Racing Red/)).toBeInTheDocument();
    expect(screen.getByText("Power (BHP): 591")).toBeInTheDocument();
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(img?.getAttribute("src") ?? "").toContain("make=audi");
    expect(document.querySelector('[data-bay-frame="card"]')).not.toBeNull();
    const card = document.querySelector("[data-trump-card]");
    expect(card).not.toBeNull();
    expect(card?.className).toMatch(/trump-card-motion/);
    expect(card).toHaveAttribute("data-trump-highlighted", "true");
    expect(document.querySelector("[data-trump-stat]")).not.toBeNull();
  });

  it("keeps motion class without category highlight when not winning", () => {
    render(
      <TrumpCard
        label="House"
        car={{
          make: "Ford",
          model: "Focus",
          trimName: "ST",
          bodyType: "Hatchback",
          colour: "Laser Blue",
          year: 2020,
        }}
      />,
    );

    const card = document.querySelector("[data-trump-card]");
    expect(card?.className).toMatch(/trump-card-motion/);
    expect(card).toHaveAttribute("data-trump-highlighted", "false");
    expect(document.querySelector("[data-trump-stat]")).toBeNull();
  });
});
