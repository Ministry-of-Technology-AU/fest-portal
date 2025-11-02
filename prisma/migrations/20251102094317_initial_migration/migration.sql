-- CreateTable
CREATE TABLE `status_trail` (
    `trailId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(6) NOT NULL,
    `status` ENUM('gate-out', 'gate-in', 'reg-in', 'reg-out') NOT NULL,
    `timestamp` DATETIME(0) NOT NULL,
    `source` ENUM('gate', 'registration', 'admin', 'system') NOT NULL,

    INDEX `userId`(`userId`),
    PRIMARY KEY (`trailId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(6) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `collegeName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `visitDates` TEXT NOT NULL,
    `currentStatus` ENUM('gate-out', 'gate-in', 'reg-in', 'reg-out') NOT NULL DEFAULT 'gate-out',
    `lastStatusTime` DATETIME(0) NOT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_event` (
    `userId` VARCHAR(6) NOT NULL,
    `eventId` INTEGER NOT NULL,
    `eventName` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`userId`, `eventId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `status_trail` ADD CONSTRAINT `status_trail_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_event` ADD CONSTRAINT `user_event_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
