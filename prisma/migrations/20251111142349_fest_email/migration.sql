/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `fest_user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `fest_user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fest_user` ADD COLUMN `email` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `fest_user_email_key` ON `fest_user`(`email`);
