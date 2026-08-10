-- 2026-08-11 — Canonicalize Project.platforms to the English tokens the
-- platformCategory dictionary expects (post-deploy QA finding).
--
-- Bug: the catalog's "Платформа" facet printed `Կինոթատրոն` verbatim in ru and
-- en alike. `platforms` is a JSON string[] stored as TEXT and the facet
-- localizes each value through `localize("platformCategory", …)`
-- (src/app/catalog/catalog-view.tsx) — an exact-token lookup into
-- "platformCategory.<Token>" in src/lib/i18n.ts. Only "Cinema" has an entry
-- ("Кинотеатры" / "Cinema" / "Կինոթատրոններ"); the stored Armenian literal
-- misses it and falls through unchanged, exactly like the genre/country
-- values the 2026-08-10 script fixed.
--
-- Brand names in the same column (Armenia TV, Kinodaran, Public TV of
-- Armenia, YouTube) have no dictionary entry either and MUST NOT get one —
-- a channel's name is the same in every locale, so falling through is the
-- correct behaviour for them. Only the generic category was mistyped.
--
-- Why the 2026-08-10 canonicalization missed it: that script's audit query
-- covered genre / genres / countries and never looked at `platforms`.
--
-- Affected rows, checked read-only on prod (u998961932_advertising) before
-- writing:
--   id 19, id 26 — both "Արամ Ասատրյան", both ["Կինոթատրոն","Kinodaran"].
-- Local dev (docker :3307) had none.
--
-- Idempotent: a quoted-substring REPLACE(), so a second run finds nothing.

UPDATE `Project`
   SET `platforms` = REPLACE(`platforms`, '"Կինոթատրոն"', '"Cinema"')
 WHERE `platforms` LIKE '%"Կինոթատրոն"%';

-- Verify (expects an empty result — the '·' in `format` is why the wider
-- multi-byte audit still returns id 27, that one is not a bad token):
--   SELECT id, title, platforms FROM Project
--   WHERE LENGTH(platforms) <> CHAR_LENGTH(platforms);
