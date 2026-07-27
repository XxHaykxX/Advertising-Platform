-- Drop the unused Expected release date column (2026-07-27)
--
-- "Expected release date" was a Production Info field on the project form
-- (a fallback used when a title had no real release date yet). The owner
-- confirmed it should be removed entirely, including the column — the app
-- no longer reads or writes it anywhere.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md).

ALTER TABLE `Project` DROP COLUMN `expectedReleaseDate`;

-- Check:
-- SHOW COLUMNS FROM Project LIKE 'expectedReleaseDate'; -- should return 0 rows
