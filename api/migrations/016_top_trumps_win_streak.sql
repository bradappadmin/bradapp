-- Consecutive Top Trumps wins (House + PvP). Loss resets. Draws keep the streak.
ALTER TABLE users
  ADD COLUMN tt_win_streak INT NOT NULL DEFAULT 0 AFTER coin_balance;

ALTER TABLE coin_ledger
  MODIFY COLUMN reason ENUM(
    'seed',
    'purchase',
    'sale',
    'admin_adjust',
    'play_reward',
    'daily_login',
    'tt_streak_bonus'
  ) NOT NULL;
