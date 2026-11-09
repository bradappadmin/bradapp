import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TradeOfferPair } from "./TradeOfferPair";

describe("TradeOfferPair", () => {
  it("renders studio photos for both sides of a trade", () => {
    render(
      <TradeOfferPair
        offerLabel="They offer"
        requestLabel="You give"
        offerCar={{
          make: "Audi",
          model: "RS6",
          trimName: "Avant",
          bodyType: "Estate",
          colour: "Racing Red",
          year: 2019,
        }}
        requestCar={{
          make: "Ford",
          model: "Focus",
          trimName: "ST",
          bodyType: "Hatchback",
          colour: "Laser Blue",
          year: 2020,
        }}
      />,
    );

    expect(screen.getByText("They offer")).toBeInTheDocument();
    expect(screen.getByText("You give")).toBeInTheDocument();
    expect(screen.getByText("Audi RS6 Avant")).toBeInTheDocument();
    expect(screen.getByText("Ford Focus ST")).toBeInTheDocument();
    const imgs = document.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs[0]?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
