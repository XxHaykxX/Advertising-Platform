-- 2026-08-04 — SponsorshipTier.priceAmd becomes nullable ("on request").
--
-- Bug: Placement.priceAmd was already nullable — an unpriced integration
-- shows "on request" on the storefront. SponsorshipTier.priceAmd was a plain
-- NOT NULL Int, and the tier editor clamped a blank price with
-- Math.max(0, Number(r.priceAmd) || 0), so a package the creator hadn't
-- priced yet was stored as literal 0 and rendered to brands as a real price
-- of "0 AMD" — reads as free. This migration makes the column match
-- Placement's contract: NULL -> "on request", same UI/i18n key.
--
-- Apply to prod MariaDB (u998961932_advertising) BEFORE pushing this code —
-- Hostinger git-autodeploy does not run db:push (see docs/DEPLOY-PLAYBOOK.md).
-- Written for MariaDB, not MySQL 8 (prod is MariaDB; local dev Docker is
-- MySQL 8 — both accept this syntax, but do not assume MariaDB-only features
-- exist on the dev box or vice versa).
--
-- ── Statement 1: drop NOT NULL ──────────────────────────────────────────
-- Always safe and required regardless of what the existing priceAmd = 0
-- rows turn out to mean — run this on its own if statement 2 below is
-- skipped for any reason.

ALTER TABLE `SponsorshipTier`
  MODIFY COLUMN `priceAmd` INT NULL;

-- ── Statement 2: backfill existing priceAmd = 0 rows to NULL ───────────
--
-- Judgement call, stated explicitly per review request rather than picked
-- silently: a tier saved as exactly 0 AMD is, in the abstract, ambiguous
-- between "the creator never priced it" (the only value the old clamped
-- form could produce for a blank field) and "deliberately free". That
-- ambiguity was resolved by INSPECTING PRODUCTION, not by assuming 0 never
-- legitimately means free in general:
--
--   Across the whole prod database there are exactly two SponsorshipTier
--   rows with priceAmd = 0 (checked 2026-08-04):
--     id=43, projectId=18, name="Official Sponser", benefits=[] (empty)
--     id=41, projectId=25, name="Official Sponser", benefits=[] (empty)
--   Both share the same typo'd placeholder name and an EMPTY benefits list.
--   An empty benefits list already fails the existing publish gate
--   (publishBlockers() in form-shared.ts requires every tier to have a
--   benefits entry) — these are abandoned half-filled draft rows, not
--   priced offers, let alone deliberately free ones. There is no real
--   "this package costs nothing" data here to destroy.
--
--   (Aside, not this migration's concern: projects 18 and 25 are both
--   APPROVED and live today while holding this benefit-less tier, so they
--   would already fail RE-approval under the current gate. Nothing here
--   assumes live rows currently satisfy publishBlockers() — they don't.)
--
-- IMPORTANT for anyone re-running this file against a different dataset
-- (a restored backup, a different environment): the WHERE clause below is
-- unconditional (`priceAmd = 0`), not scoped to these two ids or to
-- benefits IS empty. Before running it elsewhere, re-check that priceAmd=0
-- rows there are similarly abandoned drafts and not a real free price —
-- do not assume this holds by default.

UPDATE `SponsorshipTier` SET `priceAmd` = NULL WHERE `priceAmd` = 0;

-- Verify: SHOW CREATE TABLE `SponsorshipTier`;
--         SELECT COUNT(*) FROM `SponsorshipTier` WHERE `priceAmd` IS NULL;
