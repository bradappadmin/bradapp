ALTER TABLE video_reviews
  ADD COLUMN review_type ENUM('review', 'drag_race') NOT NULL DEFAULT 'review' AFTER car_model_id,
  ADD COLUMN car_model_b_id BIGINT UNSIGNED NULL AFTER review_type,
  ADD CONSTRAINT reviews_car_model_b_fk FOREIGN KEY (car_model_b_id) REFERENCES car_models(id),
  ADD KEY reviews_type_idx (review_type);
