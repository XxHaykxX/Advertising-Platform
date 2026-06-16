-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Content` (
    `key` VARCHAR(191) NOT NULL,
    `ru` TEXT NOT NULL,
    `en` TEXT NOT NULL,
    `hy` TEXT NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titleRu` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL DEFAULT '',
    `titleHy` VARCHAR(191) NOT NULL DEFAULT '',
    `genreRu` VARCHAR(191) NOT NULL DEFAULT '',
    `genreEn` VARCHAR(191) NOT NULL DEFAULT '',
    `genreHy` VARCHAR(191) NOT NULL DEFAULT '',
    `descriptionRu` TEXT NOT NULL,
    `descriptionEn` TEXT NOT NULL,
    `descriptionHy` TEXT NOT NULL,
    `placementTypeRu` VARCHAR(191) NOT NULL DEFAULT '',
    `placementTypeEn` VARCHAR(191) NOT NULL DEFAULT '',
    `placementTypeHy` VARCHAR(191) NOT NULL DEFAULT '',
    `poster` VARCHAR(191) NULL,
    `gallery` VARCHAR(2048) NOT NULL DEFAULT '[]',
    `price` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL,
    `slotsTotal` INTEGER NOT NULL DEFAULT 0,
    `slotsAvailable` INTEGER NOT NULL DEFAULT 0,
    `releaseDate` DATETIME(3) NULL,
    `platforms` VARCHAR(2048) NOT NULL DEFAULT '[]',
    `bookingDeadline` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Actor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `Actor_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Scene` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `placement` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `Scene_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Portfolio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titleRu` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL DEFAULT '',
    `titleHy` VARCHAR(191) NOT NULL DEFAULT '',
    `descriptionRu` TEXT NOT NULL,
    `descriptionEn` TEXT NOT NULL,
    `descriptionHy` TEXT NOT NULL,
    `images` VARCHAR(2048) NOT NULL DEFAULT '[]',
    `videoType` VARCHAR(191) NOT NULL DEFAULT 'youtube',
    `videoUrl` VARCHAR(191) NULL,
    `videoFile` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `projectId` INTEGER NULL,
    `projectTitle` VARCHAR(191) NULL,
    `budget` VARCHAR(191) NULL,
    `message` TEXT NULL,
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Actor` ADD CONSTRAINT `Actor_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scene` ADD CONSTRAINT `Scene_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
