-- Ф3 cast refactor: per-project Actor links to the global Person directory, and
-- role becomes multi (`roles` JSON). Additive + backfill, safe on live data.
-- Apply to prod BEFORE pushing the Ф3 code.

-- 1. New columns + index + FK to Person (nullable → legacy rows survive).
ALTER TABLE `Actor`
  ADD COLUMN `personId` INT NULL,
  ADD COLUMN `roles` TEXT NULL,
  ADD INDEX `Actor_personId_idx` (`personId`);

ALTER TABLE `Actor`
  ADD CONSTRAINT `Actor_personId_fkey`
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Seed the Person directory from every distinct Actor name not already there
--    (dedupe by name; newest-ish role/photo via MIN — good enough for seed).
INSERT INTO `Person` (`name`, `role`, `kind`, `photo`, `sortOrder`, `createdAt`)
SELECT a.name, MIN(a.role), MIN(a.kind), MIN(a.photo), 0, NOW()
FROM `Actor` a
LEFT JOIN `Person` p ON p.name = a.name
WHERE p.id IS NULL AND a.name <> ''
GROUP BY a.name;

-- 3. Link each Actor row to its Person by name.
UPDATE `Actor` a
JOIN `Person` p ON p.name = a.name
SET a.personId = p.id
WHERE a.personId IS NULL;

-- 4. Backfill multi-role from the single legacy role.
UPDATE `Actor`
SET `roles` = JSON_ARRAY(`role`)
WHERE `roles` IS NULL AND `role` IS NOT NULL AND `role` <> '';
