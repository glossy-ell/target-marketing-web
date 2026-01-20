/*
  Warnings:

  - You are about to drop the column `agency` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `distributor` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `agency`,
    DROP COLUMN `distributor`,
    ADD COLUMN `agencyId` INTEGER NULL,
    ADD COLUMN `distributorId` INTEGER NULL,
    MODIFY `role` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
