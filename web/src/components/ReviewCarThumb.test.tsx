import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewCarThumb } from "./ReviewCarThumb";

describe("ReviewCarThumb", () => {
  it("renders a studio photo for the review car", () => {
    render(
      <ReviewCarThumb
        car={{
          make: "Ford",
          model: "Focus",
          trimName: "ST",
          bodyType: "Hatchback",
          colour: "Midnight Black",
        }}
      />,
    );

    const img = screen.getByRole("img", { name: /Ford Focus ST in Midnight Black/i });
    expect(img.getAttribute("src") ?? "").toMatch(/data:image\/svg\+xml/);
  });

  it("uses linked listing paint and year for a realistic studio thumb", () => {
    render(
      <ReviewCarThumb
        car={{
          make: "Porsche",
          model: "911",
          trimName: "GT3",
          bodyType: "Coupe",
          colour: "Racing Red",
          year: 2022,
        }}
      />,
    );

    const img = screen.getByRole("img", { name: /Porsche 911 GT3 in Racing Red/i });
    const src = img.getAttribute("src") ?? "";
    expect(src).toMatch(/data:image\/svg\+xml/);
  });
});
