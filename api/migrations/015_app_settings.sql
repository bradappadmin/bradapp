CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default OFF: open signup as today. Admins may flip require_invite_code to 1.
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('require_invite_code', '0')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
