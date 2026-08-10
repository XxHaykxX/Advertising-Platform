-- 2026-08-10 — Canonicalize Project.genre / Project.genres / Project.countries
-- to the English tokens the dictionaries expect (QA-3).
--
-- Bug: `genre`/`genres` are free text (src/lib/genres.ts: "allowCustom" — the
-- picker suggests GENRES but never enforces it) and `countries` is free text
-- too (a few rows predate the Country picker added 2026-07-27). The three
-- localizers all key off the EXACT English token:
--   - genre.* / genres.*  ->  src/lib/i18n.ts dict keys "genre.<Token>"
--   - countries            ->  src/lib/countries.ts COUNTRY_LABELS (keyed
--                               English; localizeCountry() returns an
--                               unrecognized token UNCHANGED in every locale)
-- A row that stored the Russian/Armenian word directly bypasses both lookups
-- and prints verbatim regardless of the visitor's locale — the catalog facet
-- then shows the same genre/country twice, once localized and once raw.
--
-- No DB enum exists for any of these three columns (by design — see the
-- comments on Project.genre/genres/countries in prisma/schema.prisma) so
-- nothing stops a future save from reintroducing free text; this migration
-- only cleans up what's already stored.
--
-- Values fixed here (from the LOCAL dev DB, checked 2026-08-10):
--   genre    'Драма'    -> 'Drama'
--   genre    'Комедия'  -> 'Comedy'
--   genres[] 'Драма'    -> 'Drama'      (JSON-array text column, quoted match)
--   genres[] 'Мелодрама'-> 'Melodrama'
--   genres[] 'Комедия'  -> 'Comedy'
--   genres[] 'Городская история' -> 'Drama' (owner decision 2026-08-11 — fold
--     into an existing token rather than mint a new one; see below)
--   countries 'Армения' -> 'Armenia'    (token inside the ", "-joined list)
--
-- 'Городская история' ("urban story") had no canonical match — src/lib/genres.ts
-- GENRES doesn't have it, nor does the genre.* dict. Owner decision: fold it
-- into an existing token instead of adding one. Picked 'Drama' by reading the
-- one project it's on (id 47 locally, "Voices of the City" / "Городские
-- голоса" — a night-shift Yerevan taxi driver whose passengers each carry an
-- unresolved story of their own): reflective, character-driven, no comedic
-- beats in the synopsis despite `genre`/genres[0] already being "Comedy" —
-- "Drama" is the closer second descriptor, same "Comedy" + "Drama" dramedy
-- pairing id 32 and id 46 already carry. Not deleting the second genre
-- outright — the project genuinely reads as more than pure comedy, so
-- dropping it back to a single genre would lose real information, not just
-- a mistyped one.
--
-- Deliberately NOT touched — no canonical token exists, needs an owner
-- decision before anything is written:
--   countries 'Diaspora (US, France)' (ids 32/34/35 locally) — the
--     parenthetical origin-country suffix has no COUNTRY_LABELS entry either
--     (only bare "Diaspora" does), so it already renders unlocalized in
--     every locale, hy/ru/en alike — this is a display gap, not a
--     mixed-language artifact, and it is NOT specific to these two rows: any
--     project using the "Diaspora (…)" convention hits it. Splitting it into
--     "Diaspora" + real per-country tokens would lose the "credited via
--     which countries" information src/lib/data/format.ts::splitCountries
--     was written to keep intact (see its docstring) — a schema/UI change,
--     not a data cleanup, and out of scope here.
--
-- ⚠️ BEFORE running on prod (u998961932_advertising): re-run the SELECT
-- below there first — do not assume the local list above is exhaustive.
-- Prod is MariaDB, local dev is MySQL 8 in Docker (port 3307); both accept
-- this syntax (plain REPLACE()/UPDATE). Deliberately not a `RLIKE
-- '[^\x00-\x7F]'` non-ASCII check — on this MySQL 8 box that gave false
-- positives on plain-ASCII columns (an ICU-regex/charset quirk, not a typo);
-- LENGTH()<>CHAR_LENGTH() is the boring, portable way to spot a multi-byte
-- (non-ASCII) character:
--
--   SELECT id, genre, genres, countries FROM Project
--   WHERE LENGTH(genre) <> CHAR_LENGTH(genre)
--      OR LENGTH(IFNULL(genres, '')) <> CHAR_LENGTH(IFNULL(genres, ''))
--      OR LENGTH(countries) <> CHAR_LENGTH(countries);
--
-- Idempotent: every statement is a REPLACE() of an exact substring, so a
-- second run finds nothing left to replace and no-ops. Safe to re-run after
-- new rows are added, as long as any NEW non-canonical value is re-audited
-- with the SELECT above first (this file only knows about the tokens listed
-- above — it will not catch a different bad value).

-- ── genre (legacy single-value column) ──────────────────────────────────
UPDATE `Project` SET `genre` = 'Drama'   WHERE `genre` = 'Драма';
UPDATE `Project` SET `genre` = 'Comedy'  WHERE `genre` = 'Комедия';

-- ── genres (JSON string[] stored as TEXT — quoted substring replace keeps
--    the JSON valid without a JSON_* function, so this also works if a row's
--    genres somehow isn't well-formed JSON) ──────────────────────────────
UPDATE `Project` SET `genres` = REPLACE(`genres`, '"Драма"', '"Drama"')
  WHERE `genres` LIKE '%"Драма"%';
UPDATE `Project` SET `genres` = REPLACE(`genres`, '"Мелодрама"', '"Melodrama"')
  WHERE `genres` LIKE '%"Мелодрама"%';
UPDATE `Project` SET `genres` = REPLACE(`genres`, '"Комедия"', '"Comedy"')
  WHERE `genres` LIKE '%"Комедия"%';
UPDATE `Project` SET `genres` = REPLACE(`genres`, '"Городская история"', '"Drama"')
  WHERE `genres` LIKE '%"Городская история"%';

-- ── countries (", "-joined free text) ───────────────────────────────────
UPDATE `Project` SET `countries` = REPLACE(`countries`, 'Армения', 'Armenia')
  WHERE `countries` LIKE '%Армения%';

-- Verify (only rows with a genuinely un-mapped value — see the "NOT touched"
-- list above — should remain; on local dev that's the 'Diaspora (US, France)'
-- countries rows, nothing left in genre/genres):
--   SELECT id, genre, genres, countries FROM Project
--   WHERE LENGTH(genre) <> CHAR_LENGTH(genre)
--      OR LENGTH(IFNULL(genres, '')) <> CHAR_LENGTH(IFNULL(genres, ''))
--      OR LENGTH(countries) <> CHAR_LENGTH(countries);
