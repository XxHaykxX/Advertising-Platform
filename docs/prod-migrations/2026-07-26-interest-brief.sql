-- The application brief (2026-07-26, after the waves 1-3 deploy).
-- Apply to prod BEFORE pushing the code (the deploy does not run db:push —
-- see docs/DEPLOY-PLAYBOOK.md).
--
-- Until now an application carried one free-text message. The three facts a
-- seller needs in order to answer — WHAT is being placed, WHEN, and whether
-- the brand offers money or barter — arrived only if the brand happened to
-- type them into that box. Placement-brief guides in the industry list these
-- as the minimum a brand states up front, so they become their own fields.
--
-- All three are nullable: existing applications keep working untouched, and a
-- brand that prefers to write everything in prose still gets through.
ALTER TABLE `Interest`
  ADD COLUMN `productInfo`   TEXT NULL,
  ADD COLUMN `desiredTiming` VARCHAR(191) NULL,
  ADD COLUMN `dealType`      VARCHAR(32) NULL;

-- The same three facts on every entry of the history, so a resent application
-- keeps the brief it was sent with instead of inheriting the latest one.
ALTER TABLE `InterestEvent`
  ADD COLUMN `productInfo`   TEXT NULL,
  ADD COLUMN `desiredTiming` VARCHAR(191) NULL,
  ADD COLUMN `dealType`      VARCHAR(32) NULL;
