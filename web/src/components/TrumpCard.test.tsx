import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrumpCard } from "./TrumpCard";

describe("TrumpCard", () => {
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
  });
});
