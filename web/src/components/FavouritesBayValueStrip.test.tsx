import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { FavouritesBayValueStrip } from "./FavouritesBayValueStrip";

describe("FavouritesBayValueStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows favourite count and bay value from listing coin prices", () => {
    render(
      <MemoryRouter>
        <FavouritesBayValueStrip
          cars={[{ coinPrice: 420 }, { coinPrice: 80 }, { coinPrice: 15 }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "Favourites bay value" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Favourites value/i })).toBeInTheDocument();
    expect(screen.getByText(/515/)).toBeInTheDocument();
    expect(screen.getByText("3 favourites saved")).toBeInTheDocument();
    expect(screen.getByText(/remove a favourite and the total updates/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "How to" })).toHaveAttribute("href", "/how-to");
  });

  it("handles an empty favourites list", () => {
    render(
      <MemoryRouter>
        <FavouritesBayValueStrip cars={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("0 favourites saved")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Favourites value/i })).toBeInTheDocument();
  });
});
