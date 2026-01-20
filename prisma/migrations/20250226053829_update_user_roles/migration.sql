/*
  Warnings:

  - You are about to alter the column `userId` on the `Slot` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `agencyId` on the `Slot` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `distributorId` on the `Slot` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `Slot` DROP FOREIGN KEY `Slot_agencyId_fkey`;

-- DropForeignKey
ALTER TABLE `Slot` DROP FOREIGN KEY `Slot_distributorId_fkey`;

-- DropForeignKey
ALTER TABLE `Slot` DROP FOREIGN KEY `Slot_userId_fkey`;

-- DropIndex
DROP INDEX `Slot_agencyId_fkey` ON `Slot`;

-- DropIndex
DROP INDEX `Slot_distributorId_fkey` ON `Slot`;

-- DropIndex
DROP INDEX `Slot_userId_fkey` ON `Slot`;

-- AlterTable
ALTER TABLE `Slot` MODIFY `userId` INTEGER NOT NULL,
    MODIFY `agencyId` INTEGER NULL,
    MODIFY `distributorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Slot` ADD CONSTRAINT `Slot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`seq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slot` ADD CONSTRAINT `Slot_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `User`(`seq`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slot` ADD CONSTRAINT `Slot_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `User`(`seq`) ON DELETE SET NULL ON UPDATE CASCADE;
