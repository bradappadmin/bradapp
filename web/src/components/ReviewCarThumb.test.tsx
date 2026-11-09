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
    expect(img.getAttribute("src") ?? "").toContain("cdn.imagin.studio");
    expect(img.getAttribute("src") ?? "").toContain("paintDescription=Black");
  });
});
