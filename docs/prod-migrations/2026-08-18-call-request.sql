-- 2026-08-18 — call-back request lead (stage 4b).
--
-- CallRequest is the "order a call" lead on the homepage: name + phone + an
-- optional comment, no account needed. `locale` records the language the
-- visitor was on when they submitted, so staff calls back in the language
-- the lead actually arrived in rather than whatever the admin panel happens
-- to show. `handledAt` replaces an enum status: NULL is "not handled yet", a
-- timestamp is both "done" and "when" in one column.
--
-- ⚠ ORDER: purely ADDITIVE (a new table), so it runs
-- BEFORE the push, same reasoning as 2026-08-14-channel-attrs-and-event-fields.sql
-- — the moment the new code goes live it reads and writes CallRequest, and the
-- table does not exist yet on a stale schema.
--
-- Prod is MariaDB — `CREATE TABLE IF NOT EXISTS` is supported there, so this
-- file is safe to re-run.
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

CREATE TABLE IF NOT EXISTS `CallRequest` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `phone`     VARCHAR(24) NOT NULL,
  `comment`   TEXT NULL,
  `locale`    VARCHAR(2) NOT NULL DEFAULT 'hy',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `handledAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `CallRequest_handledAt_createdAt_idx` (`handledAt`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
