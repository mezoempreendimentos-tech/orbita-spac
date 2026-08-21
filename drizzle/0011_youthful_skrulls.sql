CREATE TABLE `pca_update_demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pcaUpdateId` int NOT NULL,
	`demandId` int NOT NULL,
	`sequence` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pca_update_demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `pca_update_demands_uq` UNIQUE(`pcaUpdateId`,`demandId`)
);
--> statement-breakpoint
CREATE TABLE `pca_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`pcaId` int NOT NULL,
	`updateNumber` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','ready_for_review','presidency_review','approved_for_publication','published','returned','rejected') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`decidedByUserId` int,
	`decisionNotes` text,
	`documentKey` varchar(700),
	`documentUrl` varchar(1000),
	`publicationReference` varchar(500),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pca_updates_id` PRIMARY KEY(`id`),
	CONSTRAINT `pca_updates_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `pca_updates_pca_number_uq` UNIQUE(`pcaId`,`updateNumber`)
);
--> statement-breakpoint
ALTER TABLE `planning_consolidations` ADD CONSTRAINT `planning_consolidations_plan_uq` UNIQUE(`planId`);--> statement-breakpoint
ALTER TABLE `pca_update_demands` ADD CONSTRAINT `pca_update_demands_pcaUpdateId_pca_updates_id_fk` FOREIGN KEY (`pcaUpdateId`) REFERENCES `pca_updates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_update_demands` ADD CONSTRAINT `pca_update_demands_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_updates` ADD CONSTRAINT `pca_updates_pcaId_planning_consolidations_id_fk` FOREIGN KEY (`pcaId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_updates` ADD CONSTRAINT `pca_updates_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_updates` ADD CONSTRAINT `pca_updates_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pca_update_demands_demand_idx` ON `pca_update_demands` (`demandId`);--> statement-breakpoint
CREATE INDEX `pca_updates_pca_status_idx` ON `pca_updates` (`pcaId`,`status`);