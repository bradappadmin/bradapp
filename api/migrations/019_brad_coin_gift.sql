-- Member-to-member Brad Coin gifts (ledger reasons).
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
    'gift_received'
  ) NOT NULL;
