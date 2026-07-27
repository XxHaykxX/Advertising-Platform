-- Studio dictionary for the project form (2026-07-27)
--
-- "Studio" was a single free-text input with a <datalist> of whatever had been
-- typed before, so nothing stopped the same production company from being
-- stored three different ways. It becomes a multi-select over a dictionary —
-- same contract as Country and Streaming Source: pick from the list, type a
-- studio that isn't there (remembered for every future project), staff can
-- delete one from the pool.
--
-- The field is also renamed to "Studio name" and moved next to "Available on"
-- in the form (dictionary/UI only, no schema change for those parts).
--
-- The `Project.studio` column is unchanged: still a VARCHAR, now holding a
-- comma-separated list, exactly like `countries`. Nothing here rewrites
-- project data.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md).

CREATE TABLE IF NOT EXISTS `Studio` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Studio_name_key` (`name`)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Seed = the built-in list in src/lib/studios.ts, in the same order (real
-- Armenian producers and the broadcasters that commission their own content).
-- The app falls back to that list while this table is empty, so the picker
-- works either way; seeding is what makes "delete a studio" stick.
INSERT IGNORE INTO `Studio` (`name`, `sortOrder`) VALUES
  ('Armenfilm', 0),
  ('Shant TV', 1),
  ('Armenia TV', 2),
  ('CS Media', 3),
  ('Sharm Holding', 4),
  ('Kentron TV', 5),
  ('H2 (Armenia 2)', 6),
  ('Public Television Company of Armenia (AMPTV)', 7),
  ('ATV', 8),
  ('Yerkir Media', 9),
  ('Kinodaran', 10),
  ('Bars Media', 11),
  ('Kargin Studio', 12),
  ('Sahakyants Animation Studio', 13),
  ('TM Production', 14),
  ('People of AR Productions', 15),
  ('AVA Films Production', 16),
  ('Fish Eye Art Cultural Foundation', 17),
  ('LifeTree Pictures', 18),
  ('CivilNet', 19),
  ('Yerevan Studio', 20),
  ('Vardazaryan Studio', 21),
  ('KH Production', 22),
  ('Multart Animation Studio', 23),
  ('Digistep Animation Studio', 24),
  ('Hoshkee Film', 25),
  ('The Selfish Studio', 26);

-- Values already stored on prod, folded in so no project's chip refers to a
-- studio the picker doesn't offer. Unlike the Country migration (where the
-- column held free text like "Diaspora (US, France)"), `studio` was one company
-- per project, so every distinct value is a real name.
--
-- SELECT DISTINCT studio FROM Project returned exactly three, and they are the
-- SAME company written three ways — which is the reason this dictionary exists:
INSERT IGNORE INTO `Studio` (`name`, `sortOrder`) VALUES
  ('Kinodaran Original', 100),
  ('Kinodaran Studios', 101);
-- ('Kinodaran' is already seeded above at sortOrder 10.)
--
-- TODO (by hand, not here): decide which spelling is canonical, repoint the
-- projects that use the other two, then delete the losers from the pool via the
-- form's "×". Not scripted — renaming a studio is an editorial call.

-- Check:
-- SELECT COUNT(*) FROM Studio;
