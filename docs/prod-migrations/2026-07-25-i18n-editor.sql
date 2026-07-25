-- In-admin translation editor (/admin/i18n): a TRANSLATOR staff role, the
-- per-key draft table the editor autosaves into, and the publish log shown in
-- its header. Apply to prod BEFORE pushing the code (the deploy does not run
-- db:push — see docs/DEPLOY-PLAYBOOK.md).

-- 1. New staff role. MySQL enum order must match prisma/schema.prisma.
ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('SUPERADMIN','PUBLISHER','MODERATOR','TRANSLATOR','BRAND','CREATOR')
  NOT NULL DEFAULT 'PUBLISHER';

-- 2. Draft rows — one per dictionary key the translator has touched. `mark` is
-- the colour highlight that replaced her Google-Sheet row colouring.
CREATE TABLE `UiDraft` (
  `key`         VARCHAR(191) NOT NULL,
  `hy`          TEXT NOT NULL,
  `ru`          TEXT NOT NULL,
  `en`          TEXT NOT NULL,
  `mark`        ENUM('NONE','GREEN','RED','BLUE') NOT NULL DEFAULT 'NONE',
  `note`        TEXT NULL,
  `updatedAt`   DATETIME(3) NOT NULL,
  `updatedById` INT NULL,
  `publishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`key`),
  KEY `UiDraft_publishedAt_idx` (`publishedAt`),
  KEY `UiDraft_updatedById_fkey` (`updatedById`),
  CONSTRAINT `UiDraft_updatedById_fkey` FOREIGN KEY (`updatedById`)
    REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Publish log — one row per "Сохранить и опубликовать" click.
CREATE TABLE `I18nPublish` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId`    INT NULL,
  `keyCount`  INT NOT NULL,
  `commitSha` VARCHAR(64) NOT NULL,
  `commitUrl` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `I18nPublish_userId_fkey` (`userId`),
  CONSTRAINT `I18nPublish_userId_fkey` FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Applied to prod 2026-07-25 via `prisma db push` (both tables came out
-- utf8mb4/utf8mb4_unicode_ci, verified in information_schema); the explicit
-- charset above keeps a manual replay identical.
