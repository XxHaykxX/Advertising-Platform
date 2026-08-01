-- IA-42: Release date becomes optional and supports year/month-only precision;
-- Placement deadline supports "Ongoing" (no concrete date). Apply to prod
-- MySQL (u998961932_advertising) BEFORE pushing this code (Hostinger
-- git-autodeploy does NOT run db:push — see docs/DEPLOY-PLAYBOOK.md).
-- Both columns are additive with safe defaults, so existing rows keep
-- today's behaviour: releasePrecision='DAY' (the exact date already stored),
-- applicationDeadlineOngoing=FALSE (the stored deadline still applies).

ALTER TABLE `Project`
  ADD COLUMN `applicationDeadlineOngoing` BOOLEAN NOT NULL DEFAULT FALSE, -- true = open-ended call for offers, applicationDeadline stays NULL
  ADD COLUMN `releasePrecision` VARCHAR(191) NOT NULL DEFAULT 'DAY'; -- DAY | MONTH | YEAR — how much of releaseDate the editor actually entered
