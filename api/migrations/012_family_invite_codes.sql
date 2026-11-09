CREATE TABLE IF NOT EXISTS family_invite_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  max_uses INT UNSIGNED NULL,
  uses_count INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  UNIQUE KEY family_invite_codes_code_uq (code),
  CONSTRAINT family_invite_codes_creator_fk
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  KEY family_invite_codes_status_idx (revoked_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
