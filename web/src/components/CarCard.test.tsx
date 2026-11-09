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
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("renders a hero visual with an accessible paint label", () => {
    render(
      <CarHeroVisual colour="Laser Blue" bodyType="SUV" title="Range Rover Sport" />,
    );
    expect(screen.getByRole("img", { name: /Range Rover Sport in Laser Blue/i })).toBeInTheDocument();
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
