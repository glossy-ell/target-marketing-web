-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_agencyId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_distributorId_fkey`;

-- DropIndex
DROP INDEX `User_agencyId_fkey` ON `User`;

-- DropIndex
DROP INDEX `User_distributorId_fkey` ON `User`;

-- AlterTable
ALTER TABLE `User` MODIFY `id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `User`(`seq`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `User`(`seq`) ON DELETE SET NULL ON UPDATE CASCADE;
