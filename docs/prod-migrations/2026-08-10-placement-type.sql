-- 2026-08-10 — stage 1 of docs/plan-multichannel-ads.md: placement subtypes.
--
-- One nullable column on Placement holding which of the four in-story
-- integration kinds an offer is (Product / Logo / Verbal mention / Naming
-- rights). Nullable on purpose: every row written before today has no type,
-- and an unclassified placement stays a valid, sellable row — the storefront
-- simply renders no chip for it and the catalog filter ignores it.
--
-- ⚠ ORDER: purely ADDITIVE, so it runs BEFORE the push, not after. The deploy
-- does not run `prisma db push`; the moment the new code goes live Prisma
-- SELECTs this column on every project page and catalog request (it selects
-- every scalar by default) and they would 500 until it exists. An ADD is
-- invisible to the code currently running, so applying it early is safe.
--
-- Prod is MariaDB — `ADD COLUMN IF NOT EXISTS` is supported there, so this
-- file is safe to re-run. The ENUM definition must stay byte-identical to
-- enum PlacementType in prisma/schema.prisma, or `prisma db push` will want
-- to "fix" the column later.
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

ALTER TABLE `Placement`
  ADD COLUMN IF NOT EXISTS `placementType` ENUM('PRODUCT','LOGO','VERBAL','NAMING') NULL;

-- No backfill. Guessing a type from a title would put a claim on the
-- storefront ("Verbal mention") that no creator ever made.
