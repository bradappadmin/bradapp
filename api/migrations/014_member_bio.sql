-- Short public garage bio. display_name already exists as the public name.
-- Members edit display_name + bio via profile. Empty bios stay NULL.
ALTER TABLE users
  ADD COLUMN bio VARCHAR(160) NULL AFTER display_name;
