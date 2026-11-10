import { describe, expect, it } from "vitest";
import { ledgerDirectionLabel, ledgerReasonLabel } from "./ledger-labels";

describe("ledger labels", () => {
  it("maps known reasons to short labels", () => {
    expect(ledgerReasonLabel("seed")).toBe("Starter");
    expect(ledgerReasonLabel("purchase")).toBe("Buy");
    expect(ledgerReasonLabel("sale")).toBe("Sell");
    expect(ledgerReasonLabel("daily_login")).toBe("Daily login");
    expect(ledgerReasonLabel("play_reward")).toBe("Play");
    expect(ledgerReasonLabel("tt_streak_bonus")).toBe("Win streak");
    expect(ledgerReasonLabel("weekly_cup")).toBe("Weekly cup");
    expect(ledgerReasonLabel("admin_adjust")).toBe("Admin adjust");
    expect(ledgerReasonLabel("gift_sent")).toBe("Gift sent");
    expect(ledgerReasonLabel("gift_received")).toBe("Gift received");
  });

  it("labels direction from delta", () => {
    expect(ledgerDirectionLabel(25)).toBe("in");
    expect(ledgerDirectionLabel(0)).toBe("in");
    expect(ledgerDirectionLabel(-40)).toBe("out");
  });
});
