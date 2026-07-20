-- Web Push subscriptions table. Apply on PROD (u998961932_advertising) BEFORE
-- pushing the code that reads it. One row per browser/device that granted
-- notification permission. endpoint is TEXT (long push-service URL, no unique
-- index — dedup handled in code).
CREATE TABLE `PushSubscription` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `endpoint` TEXT NOT NULL,
  `p256dh` TEXT NOT NULL,
  `auth` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PushSubscription_userId_idx` (`userId`),
  CONSTRAINT `PushSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET = utf8mb4;
