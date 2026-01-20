-- AlterTable
ALTER TABLE `Slot` ADD COLUMN `agencyId` VARCHAR(191) NULL,
    ADD COLUMN `distributorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Slot` ADD CONSTRAINT `Slot_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slot` ADD CONSTRAINT `Slot_distributorId_fkey` FOREIGN KEY (`distributorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
