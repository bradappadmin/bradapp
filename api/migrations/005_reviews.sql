CREATE TABLE IF NOT EXISTS video_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  publisher_user_id BIGINT UNSIGNED NOT NULL,
  car_model_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  byte_size INT UNSIGNED NOT NULL DEFAULT 0,
  cue_cards_json JSON NOT NULL,
  status ENUM('published', 'unpublished') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unpublished_at TIMESTAMP NULL DEFAULT NULL,
  unpublished_by_user_id BIGINT UNSIGNED NULL,
  CONSTRAINT reviews_publisher_fk FOREIGN KEY (publisher_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_car_model_fk FOREIGN KEY (car_model_id) REFERENCES car_models(id),
  CONSTRAINT reviews_unpublished_by_fk FOREIGN KEY (unpublished_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY reviews_status_idx (status),
  KEY reviews_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
