CREATE TABLE `planning_checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('demand','consolidation','opening_request') NOT NULL,
	`entityPublicId` varchar(64) NOT NULL,
	`templateCode` varchar(100),
	`code` varchar(120) NOT NULL,
	`title` varchar(500) NOT NULL,
	`required` boolean NOT NULL DEFAULT true,
	`status` enum('pending','completed','waived') NOT NULL DEFAULT 'pending',
	`notes` text,
	`completedByUserId` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_checklist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_checklist_entity_code_uq` UNIQUE(`entityType`,`entityPublicId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `planning_checklist_items` ADD CONSTRAINT `planning_checklist_items_completedByUserId_users_id_fk` FOREIGN KEY (`completedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `planning_checklist_entity_idx` ON `planning_checklist_items` (`entityType`,`entityPublicId`);--> statement-breakpoint
CREATE INDEX `planning_checklist_status_idx` ON `planning_checklist_items` (`status`);