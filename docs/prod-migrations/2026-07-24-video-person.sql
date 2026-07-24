-- Prod migration 2026-07-24 — #10 video fields + #9 global Person directory.
-- Apply to prod MySQL (u998961932_advertising) BEFORE pushing the code that uses them.
-- Additive only; safe on existing rows.

ALTER TABLE `Project` ADD COLUMN `videoEmbedUrl` VARCHAR(191) NULL;
ALTER TABLE `Project` ADD COLUMN `videoFile` VARCHAR(191) NULL;

CREATE TABLE `Person` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `role`      VARCHAR(191) NOT NULL DEFAULT '',
  `kind`      VARCHAR(191) NOT NULL DEFAULT 'CAST',
  `photo`     VARCHAR(191) NULL,
  `sortOrder` INT          NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
