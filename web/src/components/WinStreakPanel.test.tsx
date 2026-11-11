import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WinStreakPanel } from "./WinStreakPanel";

const milestones = [
  { streak: 3, coins: 15 },
  { streak: 5, coins: 40 },
];

describe("WinStreakPanel", () => {
  it("shows current streak and next bonus hint", () => {
    render(<WinStreakPanel streak={2} milestones={milestones} />);

    expect(screen.getByRole("heading", { name: "Win streak" })).toBeInTheDocument();
    expect(screen.getByLabelText("Win streak")).toBeInTheDocument();
    expect(screen.getByLabelText("Current win streak 2")).toBeInTheDocument();
    expect(screen.getByText(/1 more win for \+15 BC/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Streak bonus thresholds")).toHaveTextContent("3 wins +15 BC");
    expect(screen.getByLabelText("Streak bonus thresholds")).toHaveTextContent("5 wins +40 BC");
    expect(screen.getByText(/A loss resets the streak/i)).toBeInTheDocument();
  });

  it("marks reached milestones and shows last bonus", () => {
    render(<WinStreakPanel streak={3} milestones={milestones} lastBonus={15} />);

    expect(screen.getByText(/3 wins \+15 BC · hit/i)).toBeInTheDocument();
    expect(screen.getByText(/2 more wins for \+40 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/Last match paid \+15 BC streak bonus/i)).toBeInTheDocument();
  });
});
