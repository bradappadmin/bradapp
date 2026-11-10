import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T12:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows leaderboard standings title, London week, +50 BC prize, and countdown", () => {
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} viewerId={2} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /This week.?s cup standings/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Europe\/London/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2026-W46 · \+50 BC prize/i)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent(/Ends in 12h 00m 00s/i);
    expect(screen.getByLabelText(/Weekly cup countdown, Europe\/London/i)).toBeInTheDocument();
    expect(screen.getByLabelText("This week Top Trumps cup standings")).toBeInTheDocument();
    expect(screen.getByText(/3 wins/i)).toBeInTheDocument();
    const youLink = screen.getByRole("link", { name: /Member \(you\)/i });
    expect(youLink).toHaveAttribute("href", "/members/2");
    expect(youLink).toHaveTextContent("You");
    const youRow = youLink.closest("li");
    expect(youRow).toHaveAttribute("aria-current", "true");
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

  it("ticks the countdown each second without ending early", () => {
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("timer")).toHaveTextContent(/Ends in 12h 00m 00s/i);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent(/Ends in 11h 59m 59s/i);
  });

  it("shows week-ended copy after weekEnd", () => {
    vi.setSystemTime(new Date("2026-11-16T00:00:00.000Z"));
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("timer")).toHaveTextContent(/Week ended · next cup starting/i);
    expect(screen.getByText(/2026-W46 · \+50 BC prize/i)).toBeInTheDocument();
  });

  it("keeps compact Top Trumps cup title for Play", () => {
    render(
      <MemoryRouter>
        <WeeklyCupPanel cup={SAMPLE} compact />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Top Trumps cup" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /leaderboard/i })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
  });
});
