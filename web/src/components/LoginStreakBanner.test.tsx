import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { DailyLoginStatus } from "../api";
import { LoginStreakBanner } from "./LoginStreakBanner";

const claimed: DailyLoginStatus = {
  amount: 25,
  claimDate: "2026-11-10",
  claimedToday: true,
  claimedJustNow: true,
  balance: 140,
  streak: 3,
  streakBonusAwarded: 15,
  streakMilestones: [
    { streak: 3, coins: 15 },
    { streak: 7, coins: 50 },
  ],
};

const ready: DailyLoginStatus = {
  amount: 25,
  claimDate: "2026-11-10",
  claimedToday: false,
  claimedJustNow: false,
  balance: 100,
  streak: 2,
  streakMilestones: [
    { streak: 3, coins: 15 },
    { streak: 7, coins: 50 },
  ],
};

describe("LoginStreakBanner", () => {
  it("shows claimed +25 BC status, streak progress, and ledger / how-to links", () => {
    render(
      <MemoryRouter>
        <LoginStreakBanner dailyLogin={claimed} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Daily login and login streak")).toBeInTheDocument();
    expect(screen.getByText(/Today.?s \+25 BC claimed · \+25 BC/i)).toBeInTheDocument();
    expect(screen.getByText(/\+15 streak BC today/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Login streak ×3 · 4 more London days to day 7 \(\+50 BC\)/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coin ledger" })).toHaveAttribute("href", "/ledger");
    expect(screen.getByRole("link", { name: "How to" })).toHaveAttribute(
      "href",
      "/how-to#daily-login",
    );
    expect(screen.queryByRole("button", { name: /Claim/i })).not.toBeInTheDocument();
  });

  it("offers Claim when today’s bonus is still available", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    render(
      <MemoryRouter>
        <LoginStreakBanner dailyLogin={ready} onClaim={onClaim} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+25 BC ready for today/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Login streak ×2 · 1 more London day to day 3 \(\+15 BC\)/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Claim +25 BC" }));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
});
