-- AlterTable
ALTER TABLE `slot` ADD COLUMN `rank` INTEGER NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `slot_ranking` (
    `seq` INTEGER NOT NULL AUTO_INCREMENT,
    `ranking` VARCHAR(191) NULL DEFAULT '0',
    `productLink` VARCHAR(191) NULL DEFAULT '',
    `keyword` VARCHAR(191) NULL DEFAULT '',
    `created` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`seq`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
