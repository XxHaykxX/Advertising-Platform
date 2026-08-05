-- 2026-08-05 — the application form drops three of its brief fields.
--
-- The popup a brand fills in at /reports/[id] used to ask for its own price,
-- the deal type (cash / barter / both) and the preferred timing on top of
-- "what is being placed". Owner decision 2026-08-05: those three belong to the
-- negotiation that follows an application, not to the form that opens it, so
-- they are gone from the popup, from both cabinets, from /admin/interests and
-- from the notification e-mail.
--
-- The price of the offer being applied FOR is NOT affected — that lives on
-- Placement.priceAmd / SponsorshipTier.priceAmd, is the creator's figure, and
-- /admin/interests still shows it next to the offer's name.
--
-- ⚠ DESTRUCTIVE and IRREVERSIBLE: any sum, deal type or timing on an
-- application already in prod is deleted with the columns. This is what the
-- owner asked for (they picked "drop the columns" over "keep them unused").
--
-- ⚠ ORDER: unlike an ADD, a DROP must run AFTER the code that stops reading
-- these columns is live. Running it before the deploy lands would 500 every
-- page that still SELECTs them (Prisma selects every scalar field by default).
-- See docs/DEPLOY-PLAYBOOK.md.
--
--   1. push to main, wait for the Hostinger build to report `completed`
--   2. verify the deployed chunk marker actually changed
--   3. then run this file against u998961932_advertising

ALTER TABLE `Interest`
  DROP COLUMN `desiredTiming`,
  DROP COLUMN `dealType`,
  DROP COLUMN `offerAmountAmd`;

ALTER TABLE `InterestEvent`
  DROP COLUMN `desiredTiming`,
  DROP COLUMN `dealType`,
  DROP COLUMN `offerAmountAmd`;
