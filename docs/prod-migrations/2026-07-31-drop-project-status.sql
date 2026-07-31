-- Owner decision 2026-07-31: drop the "production stage" concept entirely —
-- Project.status (PRE_PRODUCTION/FILMING/POST_PRODUCTION/RELEASED) and every
-- catalog filter / report-page display / cabinet compare-column that read it.
-- Not to be confused with Project.moderationStatus (DRAFT/PENDING/APPROVED/
-- REJECTED), which stays untouched. Apply BEFORE pushing the code (the
-- deploy does not run db:push — see docs/DEPLOY-PLAYBOOK.md). No index on
-- the column, no FK to drop first — a plain column drop.

ALTER TABLE `Project` DROP COLUMN `status`;
