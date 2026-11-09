ALTER TABLE video_reviews
  ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD KEY reviews_featured_idx (is_featured, status);
