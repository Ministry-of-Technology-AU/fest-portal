/*
  Warnings:

  - Added the required column `festId` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `festId` to the `user_event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `festId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user_event` ADD COLUMN `festId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `festId` ON `user`(`festId`);

-- CreateIndex
CREATE INDEX `festId_event` ON `user_event`(`festId`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_festId_fkey` FOREIGN KEY (`festId`) REFERENCES `fest_user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_event` ADD CONSTRAINT `user_event_festId_fkey` FOREIGN KEY (`festId`) REFERENCES `fest_user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
