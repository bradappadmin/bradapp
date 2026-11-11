CREATE TABLE IF NOT EXISTS review_likes (
  review_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT review_likes_review_fk FOREIGN KEY (review_id) REFERENCES video_reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY review_likes_user_idx (user_id),
  KEY review_likes_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
