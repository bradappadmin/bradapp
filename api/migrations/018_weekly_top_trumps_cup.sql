-- Weekly Top Trumps family cup prize ledger reason + award idempotency.
ALTER TABLE coin_ledger
  MODIFY COLUMN reason ENUM(
    'seed',
    'purchase',
    'sale',
    'admin_adjust',
    'play_reward',
    'daily_login',
    'tt_streak_bonus',
    'weekly_cup'
  ) NOT NULL;

-- One row per completed London ISO week (week_key like 2026-W46).
CREATE TABLE IF NOT EXISTS weekly_cup_awards (
  week_key VARCHAR(16) NOT NULL PRIMARY KEY,
  winner_user_id BIGINT UNSIGNED NULL,
  win_count INT NOT NULL DEFAULT 0,
  prize_amount INT NOT NULL DEFAULT 0,
  awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weekly_cup_winner_fk
    FOREIGN KEY (winner_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
