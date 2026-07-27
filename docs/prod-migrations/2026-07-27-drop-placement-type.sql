-- Drop the unused Placement type column (2026-07-27)
--
-- "Placement type" (In-Frame / Story Integration / Mention) was a field on
-- the project form and report page. The owner confirmed it should be
-- removed entirely, including the column — the app no longer reads or
-- writes it anywhere.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md).

ALTER TABLE `Project` DROP COLUMN `placementType`;

-- Check:
-- SHOW COLUMNS FROM Project LIKE 'placementType'; -- should return 0 rows
