/*
  Warnings:

  - You are about to drop the `banjaara_event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `banjaara_status_trail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `banjaara_user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `banjaara_event` DROP FOREIGN KEY `banjaara_event_userId_fkey`;

-- DropForeignKey
ALTER TABLE `banjaara_status_trail` DROP FOREIGN KEY `banjaara_status_trail_userId_fkey`;

-- DropTable
DROP TABLE `banjaara_event`;

-- DropTable
DROP TABLE `banjaara_status_trail`;

-- DropTable
DROP TABLE `banjaara_user`;

-- CreateTable
CREATE TABLE `fest_user` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'fest',
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `fest_user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
