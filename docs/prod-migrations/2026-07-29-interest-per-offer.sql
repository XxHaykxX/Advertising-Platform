-- One application per OFFER, not per project (2026-07-29, owner decision)
--
-- Until now `Interest` was unique on (brandId, projectId) and the submit action
-- upserted on that pair. A brand that applied for a second placement on the
-- same film therefore OVERWROTE its first application — status back to SENT,
-- the creator's answer wiped, and a slot an accepted deal was holding quietly
-- returned to sale with nobody told. The report page now carries an apply
-- button on every offer card, which made that one click away.
--
-- `offerKey` is what the application is for, as one comparable value:
--   'P:<placementId>' | 'T:<tierId>' | '-'  (brand named no particular offer)
-- A composite unique over (tierId, placementId) would NOT work: MySQL lets NULL
-- repeat, so every "named nothing" application would count as distinct and one
-- brand could pile up dozens of them on a single project.
--
-- Backfill is lossless — existing rows carry at most one of the two ids.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md): the freshly
-- generated Prisma client selects `offerKey`, so the running app 500s on every
-- application read until the column exists.

ALTER TABLE `Interest` ADD COLUMN `offerKey` VARCHAR(24) NOT NULL DEFAULT '-';

UPDATE `Interest`
SET `offerKey` = CASE
  WHEN `placementId` IS NOT NULL THEN CONCAT('P:', `placementId`)
  WHEN `tierId`      IS NOT NULL THEN CONCAT('T:', `tierId`)
  ELSE '-'
END;

-- New rules FIRST, old one after — the order matters. MySQL requires an index
-- on a foreign-key column, and the brandId FK has been leaning on this very
-- unique index; dropping it while nothing else starts with `brandId` fails
-- with "needed in a foreign key constraint". Both new indexes start with
-- brandId, so once they exist the drop is safe and the FK never goes
-- unindexed. (Prisma's own diff solves this by dropping and re-adding the
-- foreign key — same result, more moving parts on a live table.)
--
-- The new unique cannot collide: a brand holding two applications for one
-- project could not exist yet, the old rule forbade it.
CREATE UNIQUE INDEX `Interest_brandId_projectId_offerKey_key`
  ON `Interest` (`brandId`, `projectId`, `offerKey`);

-- The pair is still looked up on its own (all of one brand's applications for
-- one project), and after the drop below nothing else covers it.
CREATE INDEX `Interest_brandId_projectId_idx` ON `Interest` (`brandId`, `projectId`);

DROP INDEX `Interest_brandId_projectId_key` ON `Interest`;

-- Verify:
--   SHOW CREATE TABLE `Interest`;
--   SELECT id, brandId, projectId, offerKey, tierId, placementId FROM `Interest`;
