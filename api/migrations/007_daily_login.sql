ALTER TABLE coin_ledger
  MODIFY COLUMN reason ENUM('seed', 'purchase', 'sale', 'admin_adjust', 'play_reward', 'daily_login') NOT NULL;
