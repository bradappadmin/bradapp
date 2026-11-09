import { describe, expect, it } from "vitest";
import { ledgerDirectionLabel, ledgerReasonLabel } from "./ledger-labels";

describe("ledger labels", () => {
  it("maps known reasons to short labels", () => {
    expect(ledgerReasonLabel("seed")).toBe("Starter");
    expect(ledgerReasonLabel("purchase")).toBe("Buy");
    expect(ledgerReasonLabel("sale")).toBe("Sell");
    expect(ledgerReasonLabel("daily_login")).toBe("Daily");
    expect(ledgerReasonLabel("play_reward")).toBe("Play");
    expect(ledgerReasonLabel("admin_adjust")).toBe("Admin adjust");
  });

  it("labels direction from delta", () => {
    expect(ledgerDirectionLabel(25)).toBe("in");
    expect(ledgerDirectionLabel(0)).toBe("in");
    expect(ledgerDirectionLabel(-40)).toBe("out");
  });
});
