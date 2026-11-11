-- Pin one owned listing as the public garage showcase / hero car.
-- Cleared in app code when the listing is sold or traded away.
-- ON DELETE SET NULL if the listing row goes.
ALTER TABLE users
  ADD COLUMN showcase_listing_id BIGINT UNSIGNED NULL AFTER bio,
  ADD CONSTRAINT users_showcase_listing_fk
    FOREIGN KEY (showcase_listing_id) REFERENCES listings(id) ON DELETE SET NULL
