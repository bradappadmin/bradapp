import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast-context";

function Probe() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success("Listed for sale.")}>
        Success
      </button>
      <button type="button" onClick={() => toast.error("Purchase failed")}>
        Fail
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows a success toast and auto-dismisses", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Success" }));
    expect(screen.getByRole("status")).toHaveTextContent("Listed for sale.");

    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an error toast with alert role", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Purchase failed");
  });

  it("dismisses when Close is pressed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Success" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
