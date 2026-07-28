-- 2026-07-29 — the application can name a product placement, and a price.
--
-- Two gaps the owner found in the brand's offer dialog after we split product
-- placement away from sponsorship earlier today:
--   1. the picker listed sponsorship packages only, so an in-story placement —
--      the offer the catalog leads with — could not be applied for at all;
--   2. there was no field for the sum the brand itself is prepared to pay,
--      which is the whole point of a placement priced "on request".
--
-- Both columns are nullable: every application sent before today carries
-- neither, and an application that names a package rather than a placement
-- still leaves placementId NULL.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md) — the deploy does not
-- run db:push, so the new build would query columns that do not exist yet.

ALTER TABLE `Interest`
  ADD COLUMN `placementId` INT NULL,
  ADD COLUMN `offerAmountAmd` INT NULL;

ALTER TABLE `Interest`
  ADD INDEX `Interest_placementId_idx` (`placementId`);

-- SET NULL, not CASCADE: a creator deleting a placement row must not delete the
-- brand's application along with it — the lead and its history stay, the offer
-- simply stops pointing at a row that no longer exists.
ALTER TABLE `Interest`
  ADD CONSTRAINT `Interest_placementId_fkey`
  FOREIGN KEY (`placementId`) REFERENCES `Placement`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- The brief is snapshotted per round in InterestEvent (a resend with new terms
-- must not rewrite what was originally offered), so the sum belongs there too.
ALTER TABLE `InterestEvent`
  ADD COLUMN `offerAmountAmd` INT NULL;

-- Verify:
-- SHOW COLUMNS FROM Interest LIKE '%placementId%';     -- 1 row
-- SHOW COLUMNS FROM Interest LIKE '%offerAmountAmd%';  -- 1 row
-- SHOW COLUMNS FROM InterestEvent LIKE '%offerAmountAmd%'; -- 1 row
