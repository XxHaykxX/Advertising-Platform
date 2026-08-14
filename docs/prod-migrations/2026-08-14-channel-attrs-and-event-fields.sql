-- 2026-08-14 — per-channel filters: listing attributes + the three event fields.
--
-- `attrs` is a JSON object holding whatever the channel's attribute directory
-- (src/lib/ad-channel-attrs.ts) defines for that listing: a billboard stores
-- structureType/lighting/trafficSide, a radio station stores stationFormat/
-- daypart/spotLength. One TEXT column instead of thirty-odd sparse ones,
-- because the sets barely overlap — `lighting` would be NULL on every radio
-- row forever. Same convention the schema already uses for `description`,
-- `gallery`, `platforms` and `metrics`. Filtering happens client-side, so
-- nothing here wants an index.
--
-- The three event columns are NOT attributes: a sponsorship buyer filters and
-- sorts on "what is in Yerevan in September", the card shows them, and the
-- catalogue sorts by them — that is a first-class field, not a bag entry.
-- `Project` has no city and no event date today at all, which is why event
-- sponsorship cannot be filtered by either.
--
-- ⚠ ORDER: purely ADDITIVE, so it runs BEFORE the push, not after. The deploy
-- does not run `prisma db push`; the moment the new code goes live Prisma
-- SELECTs these columns on every project and catalogue request (it selects
-- every scalar by default) and they would 500 until they exist. An ADD is
-- invisible to the code currently running, so applying it early is safe.
--
-- Prod is MariaDB — `ADD COLUMN IF NOT EXISTS` is supported there, so this
-- file is safe to re-run. TEXT columns take no literal default (MySQL forbids
-- it), hence nullable, same as `descriptionHy` and friends.
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

ALTER TABLE `AdSpace`
  ADD COLUMN IF NOT EXISTS `attrs` TEXT NULL;

ALTER TABLE `Project`
  ADD COLUMN IF NOT EXISTS `attrs` TEXT NULL;

-- Event sponsorship. All three nullable: they are meaningless on a film that
-- sells product placement only, and every row written before today has none.
-- `eventCity` mirrors AdSpace.city — free text, because Armenian place names
-- do not fit a structured schema and the facet is built from the data.
ALTER TABLE `Project`
  ADD COLUMN IF NOT EXISTS `eventCity` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `eventDate` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `eventCategory` VARCHAR(32) NOT NULL DEFAULT '';

-- No backfill. Filling a city or a date by guessing from a title would put a
-- claim on the storefront that no organiser ever made — the six live events
-- get their values from their owners, by hand.
