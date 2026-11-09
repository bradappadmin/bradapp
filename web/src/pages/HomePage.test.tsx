import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { HomePage } from "./HomePage";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

import * as api from "../api";

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
  });

  it("shows BradApp brand and auth links when signed out", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("BradApp")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Cars" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Play" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Reviews" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
  });
});
