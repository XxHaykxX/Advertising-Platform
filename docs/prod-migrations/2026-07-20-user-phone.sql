-- Creator/brand profile: contact phone column.
-- Apply on PROD (u998961932_advertising) BEFORE pushing the code that reads it.
-- Nullable, no backfill needed.
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(191) NULL;
