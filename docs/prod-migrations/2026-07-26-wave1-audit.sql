-- Wave 1 of the platform audit (docs/audit-2026-07-26-platform.md).
-- Two new Project columns. Apply to prod BEFORE pushing the code (the deploy
-- does not run db:push — see docs/DEPLOY-PLAYBOOK.md).

-- 1. Moderation rejection reason (audit 1.4). The moderator already typed one
--    into a prompt(), but it was discarded (`void reason`) — the creator got a
--    template email that never said what to fix. Now persisted and carried into
--    the email + the creator's cabinet.
ALTER TABLE `Project`
  ADD COLUMN `rejectionReason` TEXT NULL;

-- 2. Production budget (owner decision C.3, audit section 6). The CSV schema's
--    "Budget" means production budget; the existing `boxOfficeAmd` column is
--    box-office gross. Both are kept as separate figures.
ALTER TABLE `Project`
  ADD COLUMN `productionBudgetAmd` INT NULL;
