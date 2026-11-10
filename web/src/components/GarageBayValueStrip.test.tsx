import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { GarageBayValueStrip } from "./GarageBayValueStrip";

describe("GarageBayValueStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows owned count and bay value from listing coin prices", () => {
    render(
      <MemoryRouter>
        <GarageBayValueStrip
          cars={[{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "Garage bay value" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Bay value/i })).toBeInTheDocument();
    expect(screen.getByText(/515/)).toBeInTheDocument();
    expect(screen.getByText("3 cars in your bay")).toBeInTheDocument();
    expect(screen.getByText(/sold history stays out of the total/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "How to" })).toHaveAttribute(
      "href",
      "/how-to#garage-bay-value",
    );
  });

  it("handles an empty held-car list", () => {
    render(
      <MemoryRouter>
        <GarageBayValueStrip cars={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("0 cars in your bay")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Bay value/i })).toBeInTheDocument();
  });
});
