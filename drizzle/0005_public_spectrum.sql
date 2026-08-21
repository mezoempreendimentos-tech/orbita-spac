CREATE TABLE `opening_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`demandId` int NOT NULL,
	`consolidationId` int,
	`proposedWorkflowType` enum('direct_contracting','bidding') NOT NULL,
	`proposedModality` varchar(120) NOT NULL,
	`justification` text NOT NULL,
	`status` enum('draft','presidency_review','authorized','returned','rejected','instantiated') NOT NULL DEFAULT 'draft',
	`requestedByUserId` int NOT NULL,
	`decidedByUserId` int,
	`decisionNotes` text,
	`decidedAt` timestamp,
	`processId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opening_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `opening_requests_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `opening_requests_demand_uq` UNIQUE(`demandId`)
);
--> statement-breakpoint
CREATE TABLE `planning_consolidation_demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consolidationId` int NOT NULL,
	`demandId` int NOT NULL,
	`sequence` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_consolidation_demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_consolidation_demands_uq` UNIQUE(`consolidationId`,`demandId`)
);
--> statement-breakpoint
CREATE TABLE `planning_consolidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`planId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','consolidating','presidency_review','approved_for_publication','published','returned','rejected') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`decidedByUserId` int,
	`decisionNotes` text,
	`documentKey` varchar(700),
	`documentUrl` varchar(1000),
	`publicationReference` varchar(500),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_consolidations_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_consolidations_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
ALTER TABLE `demands` MODIFY COLUMN `status` enum('draft','submitted','under_review','accepted','returned','cancelled','rejected','grouped','awaiting_pca_publication','published_in_pca','awaiting_opening','opening_authorized','process_instantiated') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_requests_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_requests_consolidationId_planning_consolidations_id_fk` FOREIGN KEY (`consolidationId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_requests_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_requests_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD CONSTRAINT `opening_requests_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidation_demands` ADD CONSTRAINT `pcd_consolidation_fk` FOREIGN KEY (`consolidationId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidation_demands` ADD CONSTRAINT `planning_consolidation_demands_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidations` ADD CONSTRAINT `planning_consolidations_planId_annual_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `annual_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidations` ADD CONSTRAINT `planning_consolidations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planning_consolidations` ADD CONSTRAINT `planning_consolidations_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `opening_requests_status_idx` ON `opening_requests` (`status`);--> statement-breakpoint
CREATE INDEX `opening_requests_consolidation_idx` ON `opening_requests` (`consolidationId`);--> statement-breakpoint
CREATE INDEX `planning_consolidation_demands_demand_idx` ON `planning_consolidation_demands` (`demandId`);--> statement-breakpoint
CREATE INDEX `planning_consolidations_status_idx` ON `planning_consolidations` (`status`);--> statement-breakpoint
CREATE INDEX `planning_consolidations_plan_idx` ON `planning_consolidations` (`planId`);
