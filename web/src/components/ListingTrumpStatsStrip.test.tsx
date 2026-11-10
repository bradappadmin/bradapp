import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListingTrumpStatsStrip } from "./ListingTrumpStatsStrip";

describe("ListingTrumpStatsStrip", () => {
  it("shows Power, 0–60, and Top speed under a Top Trumps bay strip", () => {
    render(
      <ListingTrumpStatsStrip car={{ bhp: 1479, zeroToSixtySecs: 2.3, topSpeedMph: 261 }} />,
    );

    expect(screen.getByLabelText("Top Trumps bay strip")).toBeInTheDocument();
    expect(screen.getByText("Top Trumps · Play stats")).toBeInTheDocument();
    expect(screen.getByText("Power")).toBeInTheDocument();
    expect(screen.getByText("1479")).toBeInTheDocument();
    expect(screen.getByText("0–60")).toBeInTheDocument();
    expect(screen.getByText("2.3s")).toBeInTheDocument();
    expect(screen.getByText("Top speed")).toBeInTheDocument();
    expect(screen.getByText("261 mph")).toBeInTheDocument();
  });

  it("renders nothing when no trump stats are present", () => {
    const { container } = render(<ListingTrumpStatsStrip car={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
