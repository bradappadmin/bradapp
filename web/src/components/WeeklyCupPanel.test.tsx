import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { WeeklyCupSnapshot } from "../api";
import { WeeklyCupPanel } from "./WeeklyCupPanel";

const SAMPLE: WeeklyCupSnapshot = {
  timezone: "Europe/London",
  weekKey: "2026-W46",
  weekStart: "2026-11-09T00:00:00.000Z",
  weekEnd: "2026-11-16T00:00:00.000Z",
  prizeAmount: 50,
  standings: [
    { userId: 7, displayName: "Bay Friend", wins: 3, rank: 1 },
    { userId: 2, displayName: "Member", wins: 1, rank: 2 },
  ],
  previousAward: {
    weekKey: "2026-W45",
    winnerUserId: 7,
    displayName: "Bay Friend",
    wins: 4,
    prizeAmount: 50,
    alreadyAwarded: true,
  },
};

describe("WeeklyCupPanel", () => {
  it("shows leaderboard standings title, London week, and +50 BC prize", () => {
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} viewerId={2} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /This week.?s cup standings/i })).toBeInTheDocument();
    expect(screen.getByText(/Europe\/London/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-W46 · \+50 BC prize/i)).toBeInTheDocument();
    expect(screen.getByLabelText("This week Top Trumps cup standings")).toBeInTheDocument();
    expect(screen.getByText(/3 wins/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Member \(you\)/i })).toHaveAttribute(
      "href",
      "/members/2",
    );
    expect(
      screen.getByRole("link", { name: /Challenge Bay Friend to Top Trumps/i }),
    ).toHaveAttribute("href", "/play?opponent=7");
    expect(screen.getByRole("link", { name: /Offer trade with Bay Friend/i })).toHaveAttribute(
      "href",
      "/trades?with=7",
    );
    expect(
      screen.queryByRole("link", { name: /Challenge Member to Top Trumps/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Offer trade with Member/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps compact Top Trumps cup title for Play", () => {
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} compact />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Top Trumps cup" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /leaderboard/i })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
  });
});
