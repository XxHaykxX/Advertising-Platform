-- IA-44 §1, tail: the standard three positions on the nine live projects carry
-- Armenian names only.
--
-- The 2026-08-05 trilingual migration copied every existing offer name into the
-- `hy` column and left `ru`/`en` blank on purpose: an editor's own wording is
-- not ours to translate. The three STANDARD names are the exception — their
-- Russian and English wording is fixed in code (DEFAULT_PLACEMENT_SET /
-- DEFAULT_TIER_SET in src/app/admin/(panel)/projects/form-shared.ts), and every
-- project created since 05.08 is born with all three languages filled. Only the
-- rows that predate that ship are missing them, so a Russian or English brand
-- reads Armenian package names on all nine live listings.
--
-- Owner decision 2026-08-11: backfill the live projects too, not just new ones.
--
-- Data only, no schema change: safe to apply at any time, independent of a push.
-- Matches on the exact standard name and only fills columns that are still
-- empty, so an editor who has already written their own Russian name keeps it.
--
-- Expected on prod (2026-08-11): 18 tier rows + 9 placement rows.

UPDATE SponsorshipTier
SET nameRu = 'Генеральный спонсор'
WHERE nameRu = '' AND (nameHy = 'Գլխավոր հովանավոր' OR name = 'Գլխավոր հովանավոր');

UPDATE SponsorshipTier
SET nameEn = 'General sponsor'
WHERE nameEn = '' AND (nameHy = 'Գլխավոր հովանավոր' OR name = 'Գլխավոր հովանավոր');

UPDATE SponsorshipTier
SET nameRu = 'Официальный спонсор'
WHERE nameRu = '' AND (nameHy = 'Պաշտոնական հովանավոր' OR name = 'Պաշտոնական հովանավոր');

UPDATE SponsorshipTier
SET nameEn = 'Official sponsor'
WHERE nameEn = '' AND (nameHy = 'Պաշտոնական հովանավոր' OR name = 'Պաշտոնական հովանավոր');

UPDATE Placement
SET titleRu = 'Рекламная интеграция'
WHERE titleRu = '' AND (titleHy = 'Գովազդային ինտեգրացիա' OR title = 'Գովազդային ինտեգրացիա');

UPDATE Placement
SET titleEn = 'Advertising integration'
WHERE titleEn = '' AND (titleHy = 'Գովազդային ինտեգրացիա' OR title = 'Գովազդային ինտեգրացիա');

-- Check after: both counts must be 0.
-- SELECT SUM(nameRu = '' OR nameEn = '') FROM SponsorshipTier
--   WHERE nameHy IN ('Գլխավոր հովանավոր', 'Պաշտոնական հովանավոր');
-- SELECT SUM(titleRu = '' OR titleEn = '') FROM Placement
--   WHERE titleHy = 'Գովազդային ինտեգրացիա';
