CREATE TABLE `demand_consolidation_demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandConsolidationId` int NOT NULL,
	`demandId` int NOT NULL,
	`sequence` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demand_consolidation_demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `demand_consolidation_demands_uq` UNIQUE(`demandConsolidationId`,`demandId`)
);
--> statement-breakpoint
CREATE TABLE `demand_consolidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','ready_for_pca','included_in_pca','returned','cancelled') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demand_consolidations_id` PRIMARY KEY(`id`),
	CONSTRAINT `demand_consolidations_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `planning_consolidation_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planningConsolidationId` int NOT NULL,
	`demandConsolidationId` int NOT NULL,
	`sequence` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_consolidation_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_consolidation_groups_uq` UNIQUE(`planningConsolidationId`,`demandConsolidationId`)
);
--> statement-breakpoint
ALTER TABLE `planning_alerts` MODIFY COLUMN `entityType` enum('demand','demand_consolidation','pca','consolidation','opening_request') NOT NULL;--> statement-breakpoint
ALTER TABLE `planning_checklist_items` MODIFY COLUMN `entityType` enum('demand','demand_consolidation','pca','consolidation','opening_request') NOT NULL;--> statement-breakpoint
ALTER TABLE `planning_consolidations` MODIFY COLUMN `status` enum('draft','consolidating','ready_for_review','presidency_review','approved_for_publication','published','returned','rejected') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `planning_documents` MODIFY COLUMN `entityType` enum('demand','demand_consolidation','pca','consolidation','opening_request') NOT NULL;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `pcaId` int;--> statement-breakpoint
INSERT INTO `demand_consolidations` (`id`, `publicId`, `title`, `status`, `createdByUserId`, `notes`, `createdAt`, `updatedAt`)
SELECT `id`, CONCAT('CON-LEGACY-', `id`), `title`, CASE WHEN `status` = 'rejected' THEN 'returned' ELSE 'included_in_pca' END, `createdByUserId`, 'Consolidação migrada do fluxo anterior para preservar o histórico institucional.', `createdAt`, `updatedAt`
FROM `planning_consolidations`;--> statement-breakpoint
INSERT INTO `demand_consolidation_demands` (`id`, `demandConsolidationId`, `demandId`, `sequence`, `notes`, `createdAt`)
SELECT `id`, `consolidationId`, `demandId`, `sequence`, `notes`, `createdAt`
FROM `planning_consolidation_demands`;--> statement-breakpoint
INSERT INTO `planning_consolidation_groups` (`planningConsolidationId`, `demandConsolidationId`, `sequence`, `createdAt`)
SELECT `id`, `id`, 1, `createdAt`
FROM `planning_consolidations`;--> statement-breakpoint
UPDATE `planning_consolidations` SET `status` = 'draft' WHERE `status` = 'consolidating';--> statement-breakpoint
UPDATE `planning_documents` SET `entityType` = 'pca' WHERE `entityType` = 'consolidation';--> statement-breakpoint
UPDATE `planning_alerts` SET `entityType` = 'pca' WHERE `entityType` = 'consolidation';--> statement-breakpoint
UPDATE `planning_checklist_items` SET `entityType` = 'pca' WHERE `entityType` = 'consolidation';--> statement-breakpoint
UPDATE `opening_requests` SET `pcaId` = `consolidationId` WHERE `pcaId` IS NULL AND `consolidationId` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `demand_consolidation_demands` ADD CONSTRAINT `dcd_consolidation_fk` FOREIGN KEY (`demandConsolidationId`) REFERENCES `demand_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demand_consolidation_demands` ADD CONSTRAINT `dcd_demand_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demand_consolidations` ADD CONSTRAINT `demand_consolidations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidation_groups` ADD CONSTRAINT `pcg_pca_fk` FOREIGN KEY (`planningConsolidationId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidation_groups` ADD CONSTRAINT `pcg_demand_consolidation_fk` FOREIGN KEY (`demandConsolidationId`) REFERENCES `demand_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `demand_consolidation_demands_demand_idx` ON `demand_consolidation_demands` (`demandId`);--> statement-breakpoint
CREATE INDEX `demand_consolidations_status_idx` ON `demand_consolidations` (`status`);--> statement-breakpoint
CREATE INDEX `planning_consolidation_groups_pca_idx` ON `planning_consolidation_groups` (`planningConsolidationId`);--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_request_pca_fk` FOREIGN KEY (`pcaId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `opening_requests_pca_idx` ON `opening_requests` (`pcaId`);
