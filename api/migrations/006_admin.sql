ALTER TABLE users
  ADD COLUMN account_status ENUM('active', 'closed') NOT NULL DEFAULT 'active' AFTER coin_balance;
