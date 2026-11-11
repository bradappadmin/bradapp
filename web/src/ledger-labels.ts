/** Friendly labels for personal Brad Coin ledger reasons. */

export type LedgerReasonLabel =
  | "seed"
  | "purchase"
  | "sale"
  | "admin_adjust"
  | "play_reward"
  | "daily_login"
  | "tt_streak_bonus"
  | "weekly_cup"
  | "gift_sent"
  | "gift_received"
  | "login_streak_bonus";

export function ledgerReasonLabel(reason: LedgerReasonLabel): string {
  switch (reason) {
    case "seed":
      return "Starter";
    case "purchase":
      return "Buy";
    case "sale":
      return "Sell";
    case "daily_login":
      return "Daily login";
    case "play_reward":
      return "Play";
    case "tt_streak_bonus":
      return "Win streak";
    case "login_streak_bonus":
      return "Login streak";
    case "weekly_cup":
      return "Weekly cup";
    case "admin_adjust":
      return "Admin adjust";
    case "gift_sent":
      return "Gift sent";
    case "gift_received":
      return "Gift received";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

export function ledgerDirectionLabel(delta: number): "in" | "out" {
  return delta >= 0 ? "in" : "out";
}
