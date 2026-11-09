import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { HowToPage } from "./HowToPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
}));

import * as api from "../api";

describe("HowToPage", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
  });

  it("shows the family walkthrough sections and CTAs", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HowToPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "How to" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Join the family bay" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Buy and sell cars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Play Top Trumps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Free card trades" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reviews and drag races" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your bay profile" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admin for Brad and Napwood" }),
    ).toBeInTheDocument();

    expect(screen.getByText(/invite codes are optional/i)).toBeInTheDocument();
    expect(screen.getByText(/photo-first catalogue/i)).toBeInTheDocument();
    expect(screen.getByText(/challenge someone from their listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer trade on someone else’s listing/i)).toBeInTheDocument();
    expect(screen.getByText(/display name and short garage bio/i)).toBeInTheDocument();
    expect(screen.getByText(/highlight car from each garage/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Open Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Open Cars" })).toHaveAttribute("href", "/cars");
    expect(screen.getByRole("link", { name: "Open Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Open Trades" })).toHaveAttribute("href", "/trades");
    expect(screen.getByRole("link", { name: "Open Reviews" })).toHaveAttribute("href", "/reviews");
    expect(screen.getByRole("link", { name: "Open Account" })).toHaveAttribute("href", "/account");
    // Signed out: admin CTA is replaced by a note.
    expect(screen.queryByRole("link", { name: "Open Admin" })).not.toBeInTheDocument();
  });
});
