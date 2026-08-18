-- 2026-08-18 — Testimonial: video testimonials carousel on the homepage.
--
-- A client on camera, not a case study: Portfolio holds campaigns with metrics,
-- this holds a person, a quote and a clip. Kept apart so neither form is half
-- empty and neither section has to filter the other's rows out.
--
-- `video` is the clip itself — the carousel previews loop it muted, the modal
-- plays it with sound. `image` is only the poster (shown while the video loads
-- and when there is no video at all). The quote follows Portfolio's per-locale
-- pattern: nullable TEXT, falling back locale → en → first non-empty. Name,
-- role and company are proper nouns and are not translated.
--
-- ⚠ ORDER: purely ADDITIVE (one new table), so it runs BEFORE the push — the
-- moment the new code is live it reads Testimonial, and the table has to be
-- there already. Same reasoning as 2026-08-18-call-request-and-portfolio-video.sql.
--
-- Prod is MariaDB — `CREATE TABLE IF NOT EXISTS` is supported there, so this
-- file is safe to re-run.
--
-- Connect from outside Hostinger via srv2026.hstgr.io (127.0.0.1 only works on
-- the box itself). See docs/DEPLOY-PLAYBOOK.md.

CREATE TABLE IF NOT EXISTS `Testimonial` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `video`      VARCHAR(191) NULL,
  `image`      VARCHAR(191) NULL,
  `quoteHy`    TEXT NULL,
  `quoteRu`    TEXT NULL,
  `quoteEn`    TEXT NULL,
  `authorName` VARCHAR(191) NOT NULL,
  `authorRole` VARCHAR(191) NULL,
  `company`    VARCHAR(191) NULL,
  `avatar`     VARCHAR(191) NULL,
  `sortOrder`  INT NOT NULL DEFAULT 0,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
