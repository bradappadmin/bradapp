import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CompareCarPanel } from "./CompareCarPanel";

describe("CompareCarPanel", () => {
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
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
  });
});
