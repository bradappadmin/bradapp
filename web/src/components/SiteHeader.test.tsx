import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth-context";
import { SiteHeader } from "./SiteHeader";

vi.mock("../api", () => ({
  fetchMe: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  claimDailyBonus: vi.fn(),
  fetchDailyBonus: vi.fn(),
}));

import * as api from "../api";

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMe).mockRejectedValue(new Error("unauthenticated"));
  });

  it("toggles the mobile menu and shows primary links when open", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <SiteHeader />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "BradApp" })).toBeInTheDocument();
    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).not.toBeInTheDocument();

    await user.click(openButton);
    const mobileNav = screen.getByRole("navigation", { name: "Primary mobile" });
    expect(mobileNav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(mobileNav).toHaveTextContent("Cars");
    expect(mobileNav).toHaveTextContent("Play");
    expect(mobileNav).toHaveTextContent("Sign in");

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).not.toBeInTheDocument();
  });
});
