import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { SignUpPage } from "./SignUpPage";

vi.mock("../api", () => ({
  fetchMe: vi.fn().mockRejectedValue(new Error("unauthenticated")),
  fetchTradeInboxCount: vi.fn().mockResolvedValue({ pendingIncoming: 0 }),
  fetchSignupOptions: vi.fn(),
  signUp: vi.fn(),
}));

import * as api from "../api";

describe("SignUpPage invite requirement", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.fetchSignupOptions).mockResolvedValue({ requireInviteCode: false });
  });

  it("marks invite optional when require-invite is off", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignUpPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText(/Family invite code \(optional\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/invite-only right now/i)).not.toBeInTheDocument();
  });

  it("requires invite when require-invite is on", async () => {
    vi.mocked(api.fetchSignupOptions).mockResolvedValue({ requireInviteCode: true });
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignUpPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const field = await screen.findByLabelText(/^Family invite code$/i);
    expect(field).toBeRequired();
    expect(screen.getByText(/invite-only right now/i)).toBeInTheDocument();
  });
});
