-- PROD migration for the Favorites + Application feature (2026-07-19)
-- Apply on prod MySQL (u998961932_advertising) BEFORE deploying the code.
-- ADDITIVE ONLY — does NOT touch Application/Setting (unrelated legacy tables).

-- 1) Favorite: private brand shortlist (the "heart" on cards). Admins do not see it.
CREATE TABLE `Favorite` (
  `id`        INTEGER  NOT NULL AUTO_INCREMENT,
  `brandId`   INTEGER  NOT NULL,
  `projectId` INTEGER  NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Favorite_brandId_projectId_key` (`brandId`, `projectId`),
  INDEX `Favorite_projectId_idx` (`projectId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Favorite`
  ADD CONSTRAINT `Favorite_brandId_fkey`
  FOREIGN KEY (`brandId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Favorite`
  ADD CONSTRAINT `Favorite_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Interest: application fields carried from the report popup.
ALTER TABLE `Interest` ADD COLUMN `message` TEXT NULL;
ALTER TABLE `Interest` ADD COLUMN `contact` VARCHAR(191) NULL;
