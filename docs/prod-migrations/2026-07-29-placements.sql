-- 2026-07-29 — product placements as their own thing.
--
-- What the project form called "Placement(s)" was really sponsorship (logo on
-- promo materials, credits, premiere invitations). That table keeps its data
-- and is relabelled "Sponsors" in the UI; product placement — the brand inside
-- the story — becomes this new table, edited in a section ABOVE sponsors.
--
-- priceAmd is nullable on purpose: an unpriced integration shows as "on
-- request" on the storefront instead of a number nobody agreed to.
--
-- No data migration: SponsorshipTier rows stay where they are (they are
-- sponsorship), and Placement starts empty.

CREATE TABLE `Placement` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `projectId`      INT          NOT NULL,
  `title`          VARCHAR(191) NOT NULL,
  `description`    TEXT         NOT NULL,
  `image`          VARCHAR(191) NULL,
  `priceAmd`       INT          NULL,
  `totalSlots`     INT          NULL,
  `availableSlots` INT          NULL,
  `sortOrder`      INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `Placement_projectId_idx` (`projectId`),
  CONSTRAINT `Placement_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify: SHOW CREATE TABLE `Placement`;
