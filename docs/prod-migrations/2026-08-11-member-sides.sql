-- 2026-08-11 — stage A of the dual-side account plan: member sides.
--
-- Two flags replace "one email = one role" as the capability check. `role`
-- stays exactly what it always was — the member-vs-staff discriminator and
-- "how this account registered" — every "can they sell / can they buy" check
-- moves to isCreator/isBrand via src/lib/auth/capabilities.ts.
--
-- 🔴 ORDER: the ADD and the backfill UPDATEs MUST run together, in this file,
-- in this order. Between an ADD with no backfill and the UPDATEs, every
-- existing member has both flags false — and under the new code that means
-- "no cabinet reachable at all". This file IS the release for that reason;
-- skipping the backfill locks out every current member.
--
-- Prod is MariaDB — `ADD COLUMN IF NOT EXISTS` is supported there, so this
-- file is safe to re-run. `TINYINT(1) NOT NULL DEFAULT 0` must stay
-- byte-identical to `Boolean @default(false)` in prisma/schema.prisma, or a
-- later `prisma db push` will want to "fix" the columns (same caveat as
-- 2026-08-10-placement-type.sql).
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `isCreator` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `isBrand`   TINYINT(1) NOT NULL DEFAULT 0;

UPDATE `User` SET `isCreator` = 1 WHERE `role` = 'CREATOR';
UPDATE `User` SET `isBrand`   = 1 WHERE `role` = 'BRAND';

-- Both queries are re-runnable. Staff rows (SUPERADMIN/PUBLISHER/MODERATOR/
-- TRANSLATOR) are untouched and stay 0/0 — correct, they are neither side.

-- Verify before push:
-- SELECT role, isCreator, isBrand, COUNT(*) FROM User GROUP BY 1,2,3;
-- expect CREATOR -> (1,0), BRAND -> (0,1), the four staff roles -> (0,0),
-- nothing else.
