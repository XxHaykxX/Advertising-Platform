-- Streaming source becomes a global, editable dictionary (add persists for all
-- future projects; delete removes it from the pool). Apply to prod BEFORE pushing
-- the code. Seeds the four defaults so the field isn't empty on first load.

CREATE TABLE `StreamingSource` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `StreamingSource_name_key` (`name`)
);

INSERT INTO `StreamingSource` (`name`, `sortOrder`) VALUES
  ('Kinodaran', 0),
  ('YouTube', 1),
  ('TV', 2),
  ('Cinema', 3);
