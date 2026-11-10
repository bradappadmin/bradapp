import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CarCard, CarHeroVisual } from "./CarCard";

describe("CarCard", () => {
  it("shows colour cue, key specs, and a Brad Coin price badge", () => {
    render(
      <MemoryRouter>
        <CarCard
          to="/cars/9"
          badge="price"
          car={{
            id: 9,
            make: "Porsche",
            model: "911",
            trimName: "GT3",
            bodyType: "Coupe",
            colour: "Racing Red",
            year: 2022,
            bhp: 502,
            topSpeedMph: 198,
            zeroToSixtySecs: 3.2,
            coinPrice: 420,
            status: "available",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByText("420 BC")).toBeInTheDocument();
    expect(screen.getByText("502")).toBeInTheDocument();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("198 mph")).toBeInTheDocument();
    expect(screen.getByText(/Racing Red/)).toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeNull();
  });

  it("renders a photo-first media card with Top Trumps peek under the studio photo", () => {
    render(
      <MemoryRouter>
        <CarCard
          layout="media"
          to="/cars/9"
          badge="price"
          car={{
            id: 9,
            make: "Audi",
            model: "RS6",
            trimName: "Avant",
            bodyType: "Estate",
            colour: "Racing Red",
            year: 2019,
            bhp: 591,
            topSpeedMph: 155,
            zeroToSixtySecs: 3.6,
            coinPrice: 100,
            status: "available",
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /Audi RS6 Avant/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByText("100 BC")).toBeInTheDocument();
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(document.querySelector('[data-bay-frame="card"]')).not.toBeNull();
    const peek = screen.getByLabelText("Top Trumps peek");
    expect(peek).toBeInTheDocument();
    expect(peek.textContent).toMatch(/Power/);
    expect(peek.textContent).toMatch(/0–60/);
    expect(peek.textContent).toMatch(/Top speed/);
    expect(screen.getByText("591")).toBeInTheDocument();
    expect(screen.getByText("3.6s")).toBeInTheDocument();
    expect(screen.getByText("155 mph")).toBeInTheDocument();
    // Media peek replaces the denser SpecPills row under the title.
    expect(screen.queryByLabelText("Key specs")).not.toBeInTheDocument();
  });

  it("renders a hero visual with bay framing and an accessible paint label", () => {
    render(
      <CarHeroVisual
        colour="Laser Blue"
        bodyType="SUV"
        make="Land Rover"
        model="Range Rover Sport"
        title="Range Rover Sport"
      />,
    );
    expect(screen.getByRole("img", { name: /Range Rover Sport in Laser Blue/i })).toBeInTheDocument();
    expect(document.querySelector('[data-bay-frame="hero"]')).not.toBeNull();
  });

  it("shows an owned badge for garage cars", () => {
    render(
      <CarCard
        badge="owned"
        car={{
          id: 2,
          make: "Ford",
          model: "Mustang",
          colour: "Laser Blue",
          year: 2019,
          bhp: 450,
          bodyType: "Coupe",
        }}
      />,
    );
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });
});
