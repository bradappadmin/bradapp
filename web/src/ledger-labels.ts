/** Friendly labels for personal Brad Coin ledger reasons. */

export type LedgerReasonLabel =
  | "seed"
  | "purchase"
  | "sale"
  | "admin_adjust"
  | "play_reward"
  | "daily_login";

export function ledgerReasonLabel(reason: LedgerReasonLabel): string {
  switch (reason) {
    case "seed":
      return "Starter";
    case "purchase":
      return "Buy";
    case "sale":
      return "Sell";
    case "daily_login":
      return "Daily";
    case "play_reward":
      return "Play";
    case "admin_adjust":
      return "Admin adjust";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

export function ledgerDirectionLabel(delta: number): "in" | "out" {
  return delta >= 0 ? "in" : "out";
}
