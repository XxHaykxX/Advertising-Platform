-- 2026-07-30 — rebuild the legacy fallback columns hy-first.
--
-- Why: buildData() used to derive Project.title as (titleRu || titleHy ||
-- titleEn). The site's default locale is hy, and /admin/projects renders the
-- legacy `title` column, so renaming a project in Armenian saved titleHy but
-- left `title` on the old Russian name — the list kept showing the old title
-- and the rename looked like it had not saved at all. The derivation is now
-- (titleHy || titleRu || titleEn); this backfills rows written by the old code.
-- Same reordering applies to `synopsis` and `tagline`, which had the identical
-- ru-first fallback.
--
-- Data-only. No schema change, so it is safe to run before OR after the deploy
-- (unlike a column add — see docs/DEPLOY-PLAYBOOK.md). Idempotent: re-running
-- it produces the same values.
--
-- Rows whose per-locale columns are all empty keep whatever `title` already
-- holds — NULLIF+COALESCE falls through to the existing value, never to NULL
-- (title is NOT NULL).

UPDATE Project
SET title = LEFT(
      COALESCE(NULLIF(titleHy, ''), NULLIF(titleRu, ''), NULLIF(titleEn, ''), title),
      191
    );

UPDATE Project
SET synopsis = COALESCE(
      NULLIF(synopsisHy, ''), NULLIF(synopsisRu, ''), NULLIF(synopsisEn, ''), synopsis
    );

UPDATE Project
SET tagline = COALESCE(
      NULLIF(taglineHy, ''), NULLIF(taglineRu, ''), NULLIF(taglineEn, ''), tagline
    );

-- Verification — every row should now agree with the hy-first chain:
--   SELECT COUNT(*) AS mismatched FROM Project
--   WHERE title <> LEFT(COALESCE(NULLIF(titleHy,''), NULLIF(titleRu,''), NULLIF(titleEn,''), title), 191);
-- Expected: 0
