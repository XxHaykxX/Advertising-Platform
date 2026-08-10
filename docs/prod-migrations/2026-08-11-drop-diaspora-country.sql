-- 2026-08-11 — Drop the "Diaspora (…)" entry from Project.countries
-- (owner decision, QA-3 follow-up).
--
-- `countries` is a ", "-joined free-text list localized through
-- COUNTRY_LABELS (src/lib/countries.ts). "Diaspora (US, France)" has no entry
-- there — only bare "Diaspora" does — so it printed verbatim in hy, ru and en
-- alike. It is not a mixed-language artifact like the values the 2026-08-10
-- canonicalization script fixed: it is a convention ("credited via these
-- countries") that the label table was never taught.
--
-- Three ways out were put to the owner: strip the parenthetical and keep bare
-- "Diaspora" (which already translates), split it into real country tokens, or
-- remove the entry entirely. The owner chose to remove it entirely — the
-- diaspora credit does not appear in the country list at all any more.
--
-- Affected rows, checked read-only before writing:
--   prod  (u998961932_advertising): id 27 "Թեստ" — the test project kept on
--         prod deliberately (see docs/archive). One row, no live content.
--   local (docker :3307):           ids 32, 34, 35.
--
-- Idempotent: each statement is a REPLACE() of an exact substring plus a TRIM
-- of the separator it may leave behind, so a second run finds nothing and
-- no-ops.
--
-- Order matters. The ", Diaspora (US, France)" form is replaced FIRST so the
-- comma that joined it disappears with it; only then is the bare form (a row
-- where it was the sole or leading value) handled, and TRIM cleans up any
-- leading/trailing separator left over.
--
-- Back up the affected rows before running:
--   SELECT id, title, countries FROM Project WHERE countries LIKE '%Diaspora%';

-- ── the value plus the separator that preceded it ───────────────────────
UPDATE `Project`
   SET `countries` = REPLACE(`countries`, ', Diaspora (US, France)', '')
 WHERE `countries` LIKE '%, Diaspora (US, France)%';

-- ── the value when it led the list (separator follows it instead) ───────
UPDATE `Project`
   SET `countries` = REPLACE(`countries`, 'Diaspora (US, France), ', '')
 WHERE `countries` LIKE '%Diaspora (US, France), %';

-- ── the value on its own, with no separator either side ─────────────────
UPDATE `Project`
   SET `countries` = REPLACE(`countries`, 'Diaspora (US, France)', '')
 WHERE `countries` LIKE '%Diaspora (US, France)%';

-- ── tidy any separator the replacements left dangling ───────────────────
UPDATE `Project`
   SET `countries` = TRIM(BOTH ', ' FROM TRIM(`countries`))
 WHERE `countries` LIKE ', %'
    OR `countries` LIKE '%, '
    OR `countries` LIKE ' %'
    OR `countries` LIKE '% ';

-- Verify (expects an empty result):
--   SELECT id, title, countries FROM Project WHERE countries LIKE '%Diaspora%';
