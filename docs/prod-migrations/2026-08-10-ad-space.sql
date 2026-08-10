-- Stage 3 of docs/plan-multichannel-ads.md: advertising inventory that lives
-- outside a film or series (billboards, lifts, transit, radio, TV, video,
-- banners) plus what a brand buys on it.
--
-- PURELY ADDITIVE: two new tables and their foreign keys. Nothing existing is
-- altered or dropped, so per docs/DEPLOY-PLAYBOOK.md this runs on prod BEFORE
-- the push — the deploy does not call db:push, and the new code queries these
-- tables from its first request.
--
-- Generated with `prisma migrate diff --from-url <prod> --to-schema-datamodel`
-- against prod on 2026-08-10; the diff contained these five statements and
-- nothing else, confirming no other drift between prod and the schema.
--
-- Not re-runnable as-is (MariaDB has no IF NOT EXISTS for ADD CONSTRAINT) —
-- if it half-applies, drop AdSpaceOffer then AdSpace and start over. Both are
-- empty at this point, so that is safe.

-- CreateTable
CREATE TABLE `AdSpace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `channel` VARCHAR(32) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleHy` VARCHAR(191) NOT NULL DEFAULT '',
    `titleRu` VARCHAR(191) NOT NULL DEFAULT '',
    `titleEn` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `descriptionHy` TEXT NULL,
    `descriptionRu` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `sizeFormat` VARCHAR(191) NOT NULL DEFAULT '',
    `reachPerDay` INTEGER NULL,
    `sides` INTEGER NULL,
    `availableFrom` DATETIME(3) NULL,
    `availableTo` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `gallery` TEXT NULL,
    `moderationStatus` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `rejectionReason` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `AdSpace_code_key`(`code`),
    INDEX `AdSpace_ownerId_idx`(`ownerId`),
    INDEX `AdSpace_channel_idx`(`channel`),
    INDEX `AdSpace_moderationStatus_idx`(`moderationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdSpaceOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adSpaceId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameHy` VARCHAR(191) NOT NULL DEFAULT '',
    `nameRu` VARCHAR(191) NOT NULL DEFAULT '',
    `nameEn` VARCHAR(191) NOT NULL DEFAULT '',
    `priceAmd` INTEGER NULL,
    `totalSlots` INTEGER NULL,
    `availableSlots` INTEGER NULL,
    `periodHy` VARCHAR(191) NOT NULL DEFAULT '',
    `periodRu` VARCHAR(191) NOT NULL DEFAULT '',
    `periodEn` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `AdSpaceOffer_adSpaceId_idx`(`adSpaceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdSpace` ADD CONSTRAINT `AdSpace_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdSpace` ADD CONSTRAINT `AdSpace_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdSpaceOffer` ADD CONSTRAINT `AdSpaceOffer_adSpaceId_fkey` FOREIGN KEY (`adSpaceId`) REFERENCES `AdSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

