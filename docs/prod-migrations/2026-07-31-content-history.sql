-- Content edit history with restore (2026-07-31).
--
-- Adds ContentVersion (one row per save of a content record, holding the whole
-- aggregate as JSON so a restore can put a project back together with its cast,
-- tiers, placements and milestones) plus Project.updatedAt / Project.updatedById,
-- which is what the admin list shows as "changed <when> by <who>".
--
-- Apply on prod BEFORE pushing the code — the deploy does not run db:push.
-- See docs/DEPLOY-PLAYBOOK.md. Prod is MariaDB, not MySQL 8; every statement
-- below is plain DDL that both accept.

ALTER TABLE `Project` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` INTEGER NULL;

-- CreateTable
CREATE TABLE `ContentVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity` VARCHAR(32) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `action` VARCHAR(16) NOT NULL,
    `snapshot` LONGTEXT NOT NULL,
    `mediaPaths` TEXT NULL,
    `summary` TEXT NULL,
    `authorId` INTEGER NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContentVersion_entity_entityId_createdAt_idx`(`entity`, `entityId`, `createdAt`),
    INDEX `ContentVersion_createdAt_idx`(`createdAt`),
    INDEX `ContentVersion_authorId_idx`(`authorId`),
    UNIQUE INDEX `ContentVersion_entity_entityId_version_key`(`entity`, `entityId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentVersion` ADD CONSTRAINT `ContentVersion_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
