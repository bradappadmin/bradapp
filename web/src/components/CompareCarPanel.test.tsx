import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CompareCarPanel } from "./CompareCarPanel";

describe("CompareCarPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a studio hero photo and listing caption", () => {
    render(
      <MemoryRouter>
        <CompareCarPanel
          listingId={9}
          title="Porsche 911 GT3"
          year={2022}
          colour="Racing Red"
          bodyType="Coupe"
          make="Porsche"
          model="911"
          coinPrice={420}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Porsche 911 GT3/i })).toHaveAttribute(
      "href",
      "/cars/9",
    );
    expect(screen.getByText("420 BC")).toBeInTheDocument();
    expect(document.querySelector('[data-bay-frame="hero"]')).not.toBeNull();
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(screen.queryByRole("link", { name: /Challenge/i })).not.toBeInTheDocument();
  });

  it("shows Challenge beside the hero when a play deep-link is provided", () => {
    render(
      <MemoryRouter>
        <CompareCarPanel
          listingId={11}
          title="Audi RS6 Avant"
          year={2019}
          colour="Nardo Grey"
          bodyType="Estate"
          make="Audi"
          model="RS6"
          coinPrice={310}
          challengeHref="/play?opponent=177&theirCar=11"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Challenge to Top Trumps Audi RS6 Avant" })).toHaveAttribute(
      "href",
      "/play?opponent=177&theirCar=11",
    );
    expect(screen.getByText("Challenge")).toBeInTheDocument();
    expect(screen.getByLabelText("Audi RS6 Avant play actions")).toBeInTheDocument();
  });
});
