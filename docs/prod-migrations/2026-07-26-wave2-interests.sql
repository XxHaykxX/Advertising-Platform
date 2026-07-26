-- Wave 2 of the platform audit (docs/audit-2026-07-26-platform.md): closing
-- the application loop. Apply to prod BEFORE pushing the code (the deploy does
-- not run db:push — see docs/DEPLOY-PLAYBOOK.md).

-- 1. An application now says WHICH placement package it is for, whether it
--    currently holds a slot of that package, and what the creator answered
--    (audit 2.2 / 2.3).
ALTER TABLE `Interest`
  ADD COLUMN `tierId`       INT NULL,
  ADD COLUMN `slotReserved` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `respondedAt`  DATETIME(3) NULL,
  ADD COLUMN `responseNote` TEXT NULL,
  ADD INDEX `Interest_tierId_idx` (`tierId`),
  ADD CONSTRAINT `Interest_tierId_fkey` FOREIGN KEY (`tierId`)
    REFERENCES `SponsorshipTier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. History of an application: every send by the brand and every answer by the
--    creator. The Interest row stays the current state (one per brand×project,
--    overwritten on resend) — this keeps what used to be lost (audit 2.6).
CREATE TABLE `InterestEvent` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `interestId` INT NOT NULL,
  `kind`       VARCHAR(191) NOT NULL,
  `status`     ENUM('SENT','MUTUAL','DECLINED') NULL,
  `body`       TEXT NULL,
  `contact`    VARCHAR(191) NULL,
  `authorId`   INT NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `InterestEvent_interestId_idx` (`interestId`),
  CONSTRAINT `InterestEvent_interestId_fkey` FOREIGN KEY (`interestId`)
    REFERENCES `Interest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Backfill: every application that already exists becomes the first entry of
--    its own history, so nothing looks like it appeared out of nowhere.
INSERT INTO `InterestEvent` (`interestId`, `kind`, `status`, `body`, `contact`, `authorId`, `createdAt`)
SELECT `id`, 'APPLICATION', `status`, `message`, `contact`, `brandId`, `createdAt`
FROM `Interest`;
