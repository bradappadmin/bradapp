ALTER TABLE coin_ledger
  MODIFY COLUMN reason ENUM('seed', 'purchase', 'sale', 'admin_adjust', 'play_reward') NOT NULL;

CREATE TABLE IF NOT EXISTS top_trumps_matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  challenger_user_id BIGINT UNSIGNED NOT NULL,
  opponent_user_id BIGINT UNSIGNED NULL,
  challenger_listing_id BIGINT UNSIGNED NOT NULL,
  opponent_listing_id BIGINT UNSIGNED NULL,
  opponent_make VARCHAR(80) NOT NULL DEFAULT '',
  opponent_model VARCHAR(120) NOT NULL DEFAULT '',
  opponent_trim VARCHAR(120) NOT NULL DEFAULT '',
  category ENUM('bhp', 'top_speed_mph', 'zero_to_sixty_secs') NOT NULL,
  challenger_value DECIMAL(8, 2) NOT NULL,
  opponent_value DECIMAL(8, 2) NOT NULL,
  winner ENUM('challenger', 'opponent', 'draw') NOT NULL,
  coin_reward INT NOT NULL DEFAULT 0,
  mode ENUM('house', 'pvp') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tt_challenger_fk FOREIGN KEY (challenger_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT tt_opponent_user_fk FOREIGN KEY (opponent_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT tt_challenger_listing_fk FOREIGN KEY (challenger_listing_id) REFERENCES listings(id),
  CONSTRAINT tt_opponent_listing_fk FOREIGN KEY (opponent_listing_id) REFERENCES listings(id) ON DELETE SET NULL,
  KEY tt_challenger_idx (challenger_user_id),
  KEY tt_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS card_trade_offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT UNSIGNED NOT NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  offer_listing_id BIGINT UNSIGNED NOT NULL,
  request_listing_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT trade_from_fk FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT trade_to_fk FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT trade_offer_listing_fk FOREIGN KEY (offer_listing_id) REFERENCES listings(id),
  CONSTRAINT trade_request_listing_fk FOREIGN KEY (request_listing_id) REFERENCES listings(id),
  KEY trade_to_status_idx (to_user_id, status),
  KEY trade_from_status_idx (from_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
