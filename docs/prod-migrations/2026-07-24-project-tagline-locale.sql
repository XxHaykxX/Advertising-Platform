-- Per-locale tagline / logline (IA-23 press-kit localization).
-- Additive, nullable — safe to run live before deploy. Existing rows keep their
-- base `tagline`; the DTO falls back to it until the per-locale fields are filled.
-- Apply to prod (srv2026.hstgr.io, DB u998961932_advertising) BEFORE pushing code.

ALTER TABLE `Project`
  ADD COLUMN `taglineHy` TEXT NULL,
  ADD COLUMN `taglineRu` TEXT NULL,
  ADD COLUMN `taglineEn` TEXT NULL;
