-- Consecutive Europe/London daily-login days. Missed day resets on next claim.
ALTER TABLE users
  ADD COLUMN login_streak INT NOT NULL DEFAULT 0 AFTER tt_win_streak,
  ADD COLUMN login_streak_last_date DATE NULL AFTER login_streak;

ALTER TABLE coin_ledger
  MODIFY COLUMN reason ENUM(
    'seed',
    'purchase',
    'sale',
    'admin_adjust',
    'play_reward',
    'daily_login',
    'tt_streak_bonus',
    'weekly_cup',
    'gift_sent',
    'gift_received',
    'login_streak_bonus'
  ) NOT NULL;
