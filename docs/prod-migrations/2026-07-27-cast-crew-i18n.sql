-- Cast & Crew in three languages (2026-07-27)
--
-- A person's name is a proper noun: what these columns hold is transliteration,
-- not translation — Արամ Խաչատրյան / Арам Хачатрян / Aram Khachatryan.
--
-- The Person directory (/admin/cast) owns the spellings; project Actor rows
-- carry a snapshot that the server refreshes from the directory on every save.
-- The legacy `name` column stays as the ultimate fallback (pickPersonName in
-- src/lib/person-name.ts) and is kept in step whenever a spelling is edited.
--
-- Apply BEFORE pushing the code (docs/DEPLOY-PLAYBOOK.md — the deploy does not
-- run db:push).

ALTER TABLE `Person`
  ADD COLUMN `nameHy` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `nameRu` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `nameEn` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `Actor`
  ADD COLUMN `nameHy` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `nameRu` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `nameEn` VARCHAR(191) NOT NULL DEFAULT '';

-- Backfill: put each existing name in the column its script belongs to and
-- leave the other two empty, so the fallback chain (locale -> en -> base) does
-- the work until someone fills them in.
--
-- NB: prod is MariaDB 11.8, whose PCRE2 build rejects \u escapes in REGEXP
-- ("PCRE2 does not support \F, \L, \l, \N{name}, \U, or \u"), so the script
-- test is done with CONVERT(... USING ascii) instead: an Armenian name is not
-- representable in ASCII, a Latin one is. Russian is never guessed — no
-- Cyrillic spelling was ever entered, and a wrong guess would show the same
-- string twice instead of falling back.
UPDATE `Person` SET `nameHy` = `name`
WHERE `nameHy` = '' AND `name` <> '' AND CONVERT(`name` USING ascii) <> `name`;

UPDATE `Person` SET `nameEn` = `name`
WHERE `nameHy` = '' AND `nameEn` = '' AND `name` <> '';

UPDATE `Actor` SET `nameHy` = `name`
WHERE `nameHy` = '' AND `name` <> '' AND CONVERT(`name` USING ascii) <> `name`;

UPDATE `Actor` SET `nameEn` = `name`
WHERE `nameHy` = '' AND `nameEn` = '' AND `name` <> '';

-- Check: every row should now have at least one spelling filled in.
-- SELECT COUNT(*) FROM Person WHERE nameHy = '' AND nameRu = '' AND nameEn = '' AND name <> '';
-- SELECT COUNT(*) FROM Actor  WHERE nameHy = '' AND nameRu = '' AND nameEn = '' AND name <> '';
