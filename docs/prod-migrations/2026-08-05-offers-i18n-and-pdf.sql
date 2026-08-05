-- 2026-08-05 — IA-44: trilingual offers + an optional PDF sales deck.
--
-- Two changes, one migration:
--
-- 1. Placement titles/descriptions and SponsorshipTier names/benefits become
--    per-locale. The existing single-language columns (`title`, `description`,
--    `name`, `benefits`) are KEPT and stay authoritative as the fallback: a row
--    written before the editor grew its three tabs, or a locale an editor left
--    blank, still renders through pickLocale()'s fallback argument. Nothing is
--    dropped, nothing is rewritten.
--
-- 2. Project gains `presentationPdf` — a "/uploads/…" path to a sales deck the
--    creator attaches for brands to download. Same storage contract as poster
--    and gallery: a path, never a blob.
--
-- ⚠ ORDER: this is purely ADDITIVE, so it must run BEFORE the push, not after.
-- The deploy does not run `prisma db push`; the moment the new code goes live
-- it SELECTs these columns (Prisma selects every scalar by default) and every
-- project page would 500 until the columns exist. An ADD is invisible to the
-- code currently running, so applying it early is safe.
--
-- Prod is MariaDB — `ADD COLUMN IF NOT EXISTS` is supported there, so this file
-- is safe to re-run.
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

ALTER TABLE `Placement`
  ADD COLUMN IF NOT EXISTS `titleHy`       VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `titleRu`       VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `titleEn`       VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `descriptionHy` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `descriptionRu` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `descriptionEn` TEXT NULL;

ALTER TABLE `SponsorshipTier`
  ADD COLUMN IF NOT EXISTS `nameHy`     VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `nameRu`     VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `nameEn`     VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `benefitsHy` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `benefitsRu` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `benefitsEn` TEXT NULL;

ALTER TABLE `Project`
  ADD COLUMN IF NOT EXISTS `presentationPdf` VARCHAR(191) NULL;

-- Seed the Armenian column from what is already there. Prod content is written
-- in Armenian (default locale is hy), so this makes the hy tab open filled in
-- instead of blank, and costs nothing if it is wrong — the fallback would have
-- shown the same string anyway.
UPDATE `Placement`       SET `titleHy` = `title`    WHERE `titleHy` = '';
UPDATE `SponsorshipTier` SET `nameHy`  = `name`     WHERE `nameHy`  = '';
UPDATE `Placement`       SET `descriptionHy` = `description` WHERE `descriptionHy` IS NULL;
UPDATE `SponsorshipTier` SET `benefitsHy`    = `benefits`    WHERE `benefitsHy`    IS NULL;
