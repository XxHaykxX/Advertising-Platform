-- 2026-07-28 — collapse the three spellings of one studio into `Kinodaran`.
--
-- Prod carried `Kinodaran` (2 projects), `Kinodaran Studios` (4) and
-- `Kinodaran Original` (4) as separate dictionary entries, so the same company
-- appeared three times in the Studio picker and split its own catalogue.
-- `Kinodaran` wins: it is the seeded built-in (src/lib/studios.ts), the other
-- two were typed in later.
--
-- The previous per-project values are kept in
-- docs/prod-migrations/backups/2026-07-28-studio-before-merge.tsv — restoring
-- the split (if "Original" turns out to be a real sub-label rather than a typo)
-- is an UPDATE per id from that file.
--
-- Project.studio is a comma-separated list since 2026-07-27; verified before
-- running that no row mixes Kinodaran with another studio, so an exact match is
-- safe here.

UPDATE Project
   SET studio = 'Kinodaran'
 WHERE studio IN ('Kinodaran Original', 'Kinodaran Studios');

DELETE FROM Studio WHERE name IN ('Kinodaran Original', 'Kinodaran Studios');

-- Verify: expect one row (Kinodaran) and ten projects on it.
-- SELECT name FROM Studio WHERE name LIKE 'Kinodaran%';
-- SELECT studio, COUNT(*) FROM Project WHERE studio LIKE '%Kinodaran%' GROUP BY studio;
