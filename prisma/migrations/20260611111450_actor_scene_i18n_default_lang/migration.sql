-- AlterTable: add i18n columns to Actor (all varchar with empty default)
ALTER TABLE `Actor`
    ADD COLUMN `firstNameEn` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `firstNameHy` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `lastNameEn` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `lastNameHy` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `roleEn` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `roleHy` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable: varchar i18n title columns for Scene
ALTER TABLE `Scene`
    ADD COLUMN `titleEn` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `titleHy` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable: TEXT i18n columns for Scene.
-- MySQL TEXT/BLOB columns do not support DEFAULT values, so we add them
-- as nullable first, fill existing rows with '', then switch to NOT NULL.
ALTER TABLE `Scene`
    ADD COLUMN `descriptionEn` TEXT NULL,
    ADD COLUMN `descriptionHy` TEXT NULL,
    ADD COLUMN `placementEn`   TEXT NULL,
    ADD COLUMN `placementHy`   TEXT NULL;

UPDATE `Scene` SET
    `descriptionEn` = '',
    `descriptionHy` = '',
    `placementEn`   = '',
    `placementHy`   = ''
WHERE `descriptionEn` IS NULL;

ALTER TABLE `Scene`
    MODIFY COLUMN `descriptionEn` TEXT NOT NULL,
    MODIFY COLUMN `descriptionHy` TEXT NOT NULL,
    MODIFY COLUMN `placementEn`   TEXT NOT NULL,
    MODIFY COLUMN `placementHy`   TEXT NOT NULL;
