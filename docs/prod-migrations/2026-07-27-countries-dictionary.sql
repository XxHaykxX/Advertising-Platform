-- Country dictionary for the project form (2026-07-27)
--
-- "Countries" was a free-text multi-select: every editor typed their own
-- spelling ("US" / "USA" / "United States") and the catalog counted them as
-- different countries. It becomes a picked list — with the same escape hatch as
-- Streaming Source: a country that isn't listed can be typed in, is remembered
-- for every future project, and can be deleted from the pool by staff.
--
-- The field is also renamed to "Content Original Countries" (dictionary only,
-- no schema change for that part).
--
-- Projects keep whatever their `countries` column already holds — nothing here
-- rewrites project data.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md).

CREATE TABLE IF NOT EXISTS `Country` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Country_name_key` (`name`)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Seed = the built-in list in src/lib/countries.ts, in the same order. The app
-- falls back to that list while this table is empty, so the picker works either
-- way; seeding is what makes "delete a country" stick.
INSERT IGNORE INTO `Country` (`name`, `sortOrder`) VALUES
  ('Armenia', 0),
  ('Russia', 1),
  ('Georgia', 2),
  ('USA', 3),
  ('France', 4),
  ('Germany', 5),
  ('Italy', 6),
  ('United Kingdom', 7),
  ('Spain', 8),
  ('Poland', 9),
  ('Ukraine', 10),
  ('Kazakhstan', 11),
  ('Turkey', 12),
  ('Iran', 13),
  ('Lebanon', 14),
  ('United Arab Emirates', 15),
  ('Canada', 16),
  ('Netherlands', 17),
  ('Belgium', 18),
  ('Czech Republic', 19),
  ('Greece', 20),
  ('India', 21),
  ('China', 22),
  ('Japan', 23),
  ('South Korea', 24),
  ('Argentina', 25),
  ('Brazil', 26),
  ('Mexico', 27),
  ('Diaspora', 28);

-- Deliberately NOT seeded from Project.countries: that column holds free text
-- like "Diaspora (US, France)" and Russian spellings, so splitting it on commas
-- fills the dictionary with fragments. Projects keep and display whatever they
-- store (the picker renders a stored value as a chip regardless); anything
-- worth offering again is added by picking or typing it once.

-- Check:
-- SELECT COUNT(*) FROM Country;
