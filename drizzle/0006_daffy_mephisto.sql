CREATE TABLE `planning_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('demand','consolidation','opening_request') NOT NULL,
	`entityPublicId` varchar(64) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(500) NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `planning_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('demand','consolidation','opening_request') NOT NULL,
	`entityPublicId` varchar(64) NOT NULL,
	`documentType` varchar(120) NOT NULL,
	`title` varchar(500) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`storageKey` varchar(700) NOT NULL,
	`storageUrl` varchar(1000) NOT NULL,
	`mimeType` varchar(150),
	`sizeBytes` int,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `demands` ADD `containsPersonalData` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `demands` ADD `containsSensitiveData` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `demands` ADD `privacyContext` text;--> statement-breakpoint
ALTER TABLE `planning_documents` ADD CONSTRAINT `planning_documents_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `planning_alerts_entity_idx` ON `planning_alerts` (`entityType`,`entityPublicId`);--> statement-breakpoint
CREATE INDEX `planning_alerts_status_idx` ON `planning_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `planning_documents_entity_idx` ON `planning_documents` (`entityType`,`entityPublicId`);