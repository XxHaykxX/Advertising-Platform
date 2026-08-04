-- 2026-08-04 — drop three dead Project columns: language, boxOfficeAmd,
-- streamingSource.
--
-- All three had already been unreachable from both project forms (removed on
-- 2026-07-26/27, owner requests) — no field writes them, and nothing on the
-- public site reads them any more (the "Available on" facet reads `platforms`
-- instead; #29 merged the old per-project Streaming source field into it).
--
-- "Unreachable from the form" does NOT by itself prove these are empty: the
-- Kinodaran projects (ids 18-25) were loaded partly from a CSV import, which
-- could have written directly into a column no editor UI ever touched. So
-- prod was queried directly, twice, before committing to a drop:
--   1. An aggregate SELECT ... SUM(column IS NOT NULL AND <> '') across all
--      8 Project rows, 2026-08-04: language_filled=0, boxoffice_filled=0,
--      streaming_filled=0.
--   2. A per-row re-check of the same 8 rows (id, code, title + the three raw
--      column values) to rule out the aggregate hiding a row-level surprise —
--      every one of the 8 (including the Kinodaran-CSV rows, e.g. #PP-2026-5774
--      "Վալդակար", #PP-2026-9115 "Արամ Ասատրյան") came back
--      language="" / boxOfficeAmd=NULL / streamingSource=NULL.
-- i.e. every one of these columns is empty on every project in prod — there
-- is no data to lose. Not to be confused with the StreamingSource dictionary
-- table (the reusable "Available on" option list, /admin's global picker
-- data) — that table and its rows are untouched by this migration; only the
-- per-project `Project.streamingSource` column goes.
--
-- Apply to prod MariaDB (u998961932_advertising) BEFORE pushing this code —
-- Hostinger git-autodeploy does not run db:push (see docs/DEPLOY-PLAYBOOK.md).
-- Written for MariaDB (prod), not assumed to also be MySQL-8-only syntax.
-- No indexes on these columns, no FKs to drop first — plain column drops.

ALTER TABLE `Project`
  DROP COLUMN `language`,
  DROP COLUMN `boxOfficeAmd`,
  DROP COLUMN `streamingSource`;

-- Verify: SHOW COLUMNS FROM Project WHERE Field IN ('language','boxOfficeAmd','streamingSource');
--         -- should return 0 rows
