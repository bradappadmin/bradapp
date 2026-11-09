ALTER TABLE users
  MODIFY COLUMN account_status ENUM('active', 'closed', 'frozen') NOT NULL DEFAULT 'active';
