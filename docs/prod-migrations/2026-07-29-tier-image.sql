-- SponsorshipTier gets an image (2026-07-29)
--
-- Sponsor cards ("Sponsors" section, formerly the "Placement(s)" tier list)
-- get a 16:9 still atop the card, same contract as Placement.image: nullable,
-- a "/uploads/…" path, no image -> no picture on the card.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md).

ALTER TABLE `SponsorshipTier` ADD COLUMN `image` VARCHAR(191) NULL;

-- Verify: SHOW CREATE TABLE `SponsorshipTier`;

-- Drift left over from the 2026-07-29 application-dialog batch: both columns
-- went in as VARCHAR(32) while the schema declares a plain String, i.e.
-- VARCHAR(191). The stored values are CASH / BARTER / BOTH, so nothing is
-- truncated either way — widening only so `prisma migrate diff` against prod
-- comes back empty instead of reporting these on every future deploy.
ALTER TABLE `Interest` MODIFY `dealType` VARCHAR(191) NULL;
ALTER TABLE `InterestEvent` MODIFY `dealType` VARCHAR(191) NULL;
