/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seq` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `age`,
    DROP COLUMN `email`,
    ADD COLUMN `agency` VARCHAR(191) NULL,
    ADD COLUMN `distributor` VARCHAR(191) NULL,
    ADD COLUMN `is_deleted` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` INTEGER NOT NULL,
    ADD COLUMN `seq` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`seq`);

-- CreateIndex
CREATE UNIQUE INDEX `User_id_key` ON `User`(`id`);
