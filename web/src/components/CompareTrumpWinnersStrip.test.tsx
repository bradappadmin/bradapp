import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CompareRow } from "../compare-specs";
import { CompareTrumpWinnersStrip } from "./CompareTrumpWinnersStrip";

const rows: CompareRow[] = [
  { id: "bhp", label: "Power", left: "502", right: "591", highlight: "right" },
  { id: "zero-sixty", label: "0–60", left: "3.2s", right: "3.6s", highlight: "left" },
  {
    id: "top-speed",
    label: "Top speed",
    left: "197 mph",
    right: "197 mph",
    highlight: "tie",
  },
];

describe("CompareTrumpWinnersStrip", () => {
  it("marks Power / 0–60 / Top speed winners and ties under Play rules", () => {
    render(
      <CompareTrumpWinnersStrip
        rows={rows}
        leftTitle="Porsche 911 GT3"
        rightTitle="Audi RS6 Avant"
      />,
    );

    expect(screen.getByLabelText("Top Trumps winners")).toBeInTheDocument();
    expect(screen.getByText("Category winners")).toBeInTheDocument();
    expect(screen.getByText(/Higher Power and Top speed win/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Power Audi RS6 Avant · Wins/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/0–60 Porsche 911 GT3 · Wins/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Top speed Porsche 911 GT3 · Tie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Top speed Audi RS6 Avant · Tie/i)).toBeInTheDocument();
  });
});
