import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../toast-context";
import { CopyShareLinkButton } from "./CopyShareLinkButton";

vi.mock("../share-link", async () => {
  const actual = await vi.importActual<typeof import("../share-link")>("../share-link");
  return {
    ...actual,
    copyTextToClipboard: vi.fn(),
  };
});

import { copyTextToClipboard } from "../share-link";

describe("CopyShareLinkButton toasts", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("toasts when the share link is copied", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <CopyShareLinkButton path="/cars/9" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
  });

  it("toasts an error when copy fails", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(false);
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <CopyShareLinkButton path="/cars/9" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not copy link.");
  });
});
