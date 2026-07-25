-- Phase 2 (admin form redesign) — additive columns, safe on live data.
-- Apply to prod MySQL (u998961932_advertising) BEFORE pushing the Phase 2 code
-- (Hostinger git-autodeploy does NOT run db:push). All columns nullable or
-- defaulted, so existing rows are unaffected.

ALTER TABLE `Project`
  ADD COLUMN `durationMinutes`     INT NULL,          -- Single (FILM) total runtime, minutes
  ADD COLUMN `boxOfficeAmd`        INT NULL,          -- box-office gross (кассовый сбор), info only
  ADD COLUMN `expectedReleaseDate` DATETIME(3) NULL,  -- planned release when not yet released
  ADD COLUMN `streamingSource`     TEXT NULL;         -- JSON/CSV multi (Kinodaran|YouTube|TV|Cinema)

ALTER TABLE `SponsorshipTier`
  ADD COLUMN `isExclusive`    BOOLEAN NOT NULL DEFAULT FALSE, -- exclusive vs shared placement
  ADD COLUMN `totalSlots`     INT NULL,                       -- total capacity ("Y" in "3 of 10")
  ADD COLUMN `availableSlots` INT NULL;                       -- still-open slots ("X"), null=unspecified
