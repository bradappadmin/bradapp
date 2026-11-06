ALTER TABLE users
  ADD COLUMN coin_balance INT NOT NULL DEFAULT 0 AFTER role;

ALTER TABLE listings
  ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER owner_label,
  ADD CONSTRAINT listings_owner_user_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE listings
  MODIFY COLUMN status ENUM('available', 'owned', 'sold') NOT NULL DEFAULT 'available';

CREATE TABLE IF NOT EXISTS coin_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  delta INT NOT NULL,
  balance_after INT NOT NULL,
  reason ENUM('seed', 'purchase', 'sale', 'admin_adjust') NOT NULL,
  listing_id BIGINT UNSIGNED NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coin_ledger_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT coin_ledger_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
  CONSTRAINT coin_ledger_created_by_fk FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY coin_ledger_user_idx (user_id),
  KEY coin_ledger_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
