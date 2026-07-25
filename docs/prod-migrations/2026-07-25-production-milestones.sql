-- Ф4/#27 Production Timeline — per-project production-stage timeline
-- (ProductionMilestone), edited inline in the admin project form and rendered
-- on the report page. Apply to PROD (u998961932_advertising) BEFORE pushing the
-- code, since Hostinger git auto-deploy skips `prisma db push`. Idempotent-ish:
-- `CREATE TABLE IF NOT EXISTS` so a re-run is safe.

CREATE TABLE IF NOT EXISTS `ProductionMilestone` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `projectId` INT          NOT NULL,
  `label`     VARCHAR(191) NOT NULL,
  `date`      DATETIME(3)  NULL,
  `note`      VARCHAR(191) NOT NULL DEFAULT '',
  `isActive`  TINYINT(1)   NOT NULL DEFAULT 0,
  `sortOrder` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `ProductionMilestone_projectId_idx` (`projectId`),
  CONSTRAINT `ProductionMilestone_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
