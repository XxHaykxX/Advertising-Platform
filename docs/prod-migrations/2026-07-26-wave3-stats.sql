-- Wave 3 of the platform audit (docs/audit-2026-07-26-platform.md): give the
-- creator numbers about their own listing (audit 4.8). Apply to prod BEFORE
-- pushing the code (the deploy does not run db:push — see docs/DEPLOY-PLAYBOOK.md).

ALTER TABLE `Project`
  ADD COLUMN `viewCount` INT NOT NULL DEFAULT 0;
