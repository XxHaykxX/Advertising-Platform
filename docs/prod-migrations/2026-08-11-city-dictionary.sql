-- City dictionary for the ad-space form (2026-08-11, #64 — owner decision)
--
-- "City" was a free-text input: a creator typed it in whatever script they
-- were using, so AdSpace.city held "Երևան" verbatim and every locale printed
-- it verbatim too (QA-8). Same fix as Country/Studio (2026-07-27): a picked
-- list, with the same escape hatch — a city that isn't listed can be typed
-- in, is remembered for every future ad space, and can be deleted from the
-- pool by staff. `address` (street, building) is UNCHANGED and stays free
-- text — see the comment on AdSpace.city/address in prisma/schema.prisma.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md), same as every
-- other dictionary migration.
--
-- 🔴 PROD: DO NOT RUN THIS YET. Checked prod (u998961932_advertising)
-- read-only on 2026-08-11 — the `AdSpace` table does not exist there at all;
-- stage 3 of the multichannel-ads plan (docs/plan-multichannel-ads.md) is
-- still undeployed (see task #33 / #65). There is no `city` column anywhere
-- on prod for the UPDATE below to touch. Re-check with
-- `SHOW TABLES LIKE 'AdSpace';` before ever running this file there — if it
-- still returns empty, this migration is not applicable yet.
--
-- Applied to LOCAL dev only (2026-08-11) — before/after:
--   SELECT id, code, city FROM AdSpace;
--     BEFORE: (1,  '#AS-2026-0001', 'Երևան')
--             (11, '#AS-2026-0002', 'Երևան')
--     AFTER:  (1,  '#AS-2026-0001', 'Yerevan')
--             (11, '#AS-2026-0002', 'Yerevan')

CREATE TABLE IF NOT EXISTS `City` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `City_name_key` (`name`)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Seed = the built-in list in src/lib/cities.ts (CITY_VALUES), in the same
-- order. The app falls back to that list while this table is empty, so the
-- picker works either way; seeding is what makes "delete a city" stick.
INSERT IGNORE INTO `City` (`name`, `sortOrder`) VALUES
  ('Yerevan', 0),
  ('Gyumri', 1),
  ('Vanadzor', 2),
  ('Vagharshapat', 3),
  ('Hrazdan', 4),
  ('Abovyan', 5),
  ('Kapan', 6),
  ('Armavir', 7),
  ('Gavar', 8),
  ('Artashat', 9),
  ('Ijevan', 10),
  ('Dilijan', 11),
  ('Sevan', 12),
  ('Goris', 13),
  ('Stepanavan', 14),
  ('Ashtarak', 15),
  ('Charentsavan', 16),
  ('Alaverdi', 17),
  ('Spitak', 18),
  ('Ararat', 19);

-- Canonicalize what AdSpace.city already stores — every value on local dev
-- today is the hy spelling of Yerevan (src/lib/cities.ts ALIASES["Երևան"] =
-- "Yerevan"). Idempotent (exact-match UPDATE, no-ops on a second run).
-- Re-audit with the SELECT below first if new rows exist by the time this
-- runs anywhere else — this statement only knows about the one alias seen
-- locally, not every alias the dictionary recognises.
UPDATE `AdSpace` SET `city` = 'Yerevan' WHERE `city` = 'Երևան';

-- Verify (should return nothing outside CITY_VALUES for any row this
-- migration was meant to cover):
--   SELECT id, code, city FROM AdSpace WHERE city NOT IN (SELECT name FROM City);
