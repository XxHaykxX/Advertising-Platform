-- Publisher Accounts (Phase 0): User table + Role enum, Project.ownerId, Portfolio.publisherId
-- Hand-split so the new required Project.ownerId FK does not break existing rows:
--   1) create User table
--   2) seed SUPERADMIN (reusing the existing Setting.admin_password_hash if present)
--   3) add Project.ownerId as NULLABLE
--   4) backfill every existing Project to the SUPERADMIN id
--   5) alter Project.ownerId to NOT NULL, then add its FK + index
--   6) add Portfolio.publisherId (nullable, SET NULL on delete) + FK + index

-- CreateTable User
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPERADMIN', 'PUBLISHER') NOT NULL DEFAULT 'PUBLISHER',
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed SUPERADMIN — reuse the existing admin password hash (Setting.admin_password_hash)
-- when present; otherwise fall back to a bcrypt hash of "admin1234" (rounds=10).
-- prisma/seed.ts reconciles this row on every `prisma db seed` run.
INSERT INTO `User` (`email`, `passwordHash`, `role`, `name`, `isActive`)
SELECT
    'admin@admin.com',
    COALESCE(
        (SELECT `value` FROM `Setting` WHERE `key` = 'admin_password_hash'),
        '$2b$10$9ijTwrjXovKH2rY2V5Bv0emIz/TcY7N3hTltUSjsPQj6r7DG6Xiri' -- bcrypt("admin1234", 10)
    ),
    'SUPERADMIN',
    'Admin',
    true
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE `email` = 'admin@admin.com');

-- AlterTable Project — add ownerId as NULLABLE first (existing rows have no owner yet)
ALTER TABLE `Project` ADD COLUMN `ownerId` INTEGER NULL;

-- Backfill: every existing project belongs to the SUPERADMIN
UPDATE `Project` p
    JOIN `User` u ON u.`email` = 'admin@admin.com'
    SET p.`ownerId` = u.`id`
    WHERE p.`ownerId` IS NULL;

-- Now safe to require it
ALTER TABLE `Project` MODIFY COLUMN `ownerId` INTEGER NOT NULL;

-- CreateIndex + AddForeignKey for Project.ownerId
CREATE INDEX `Project_ownerId_idx` ON `Project`(`ownerId`);
ALTER TABLE `Project` ADD CONSTRAINT `Project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable Portfolio — nullable publisherId, no backfill needed
ALTER TABLE `Portfolio` ADD COLUMN `publisherId` INTEGER NULL;

-- CreateIndex + AddForeignKey for Portfolio.publisherId
CREATE INDEX `Portfolio_publisherId_idx` ON `Portfolio`(`publisherId`);
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_publisherId_fkey` FOREIGN KEY (`publisherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
