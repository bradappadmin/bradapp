CREATE TABLE IF NOT EXISTS car_models (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  trim_name VARCHAR(120) NOT NULL DEFAULT '',
  body_type VARCHAR(40) NOT NULL,
  fuel VARCHAR(40) NOT NULL,
  drivetrain VARCHAR(40) NOT NULL,
  doors TINYINT UNSIGNED NOT NULL DEFAULT 4,
  seats TINYINT UNSIGNED NOT NULL DEFAULT 5,
  bhp SMALLINT UNSIGNED NOT NULL,
  top_speed_mph SMALLINT UNSIGNED NOT NULL,
  zero_to_sixty_secs DECIMAL(4, 2) NOT NULL,
  UNIQUE KEY car_models_unique (make, model, trim_name),
  KEY car_models_make_idx (make),
  KEY car_models_body_idx (body_type),
  KEY car_models_fuel_idx (fuel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS garages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  tagline VARCHAR(200) NOT NULL DEFAULT '',
  UNIQUE KEY garages_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  car_model_id BIGINT UNSIGNED NOT NULL,
  garage_id BIGINT UNSIGNED NOT NULL,
  condition_type ENUM('new', 'used') NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  colour VARCHAR(40) NOT NULL,
  mileage INT UNSIGNED NOT NULL DEFAULT 0,
  coin_price INT UNSIGNED NOT NULL,
  owner_label VARCHAR(120) NOT NULL,
  status ENUM('available', 'sold') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT listings_car_model_fk FOREIGN KEY (car_model_id) REFERENCES car_models(id),
  CONSTRAINT listings_garage_fk FOREIGN KEY (garage_id) REFERENCES garages(id),
  KEY listings_condition_idx (condition_type),
  KEY listings_year_idx (year),
  KEY listings_price_idx (coin_price),
  KEY listings_mileage_idx (mileage),
  KEY listings_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
