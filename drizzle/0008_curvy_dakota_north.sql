CREATE TABLE `reference_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`value` varchar(120) NOT NULL,
	`label` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reference_list_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `reference_list_items_value_uq` UNIQUE(`listId`,`value`)
);
--> statement-breakpoint
CREATE TABLE `reference_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reference_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `reference_lists_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `reference_list_items` ADD CONSTRAINT `reference_list_items_listId_reference_lists_id_fk` FOREIGN KEY (`listId`) REFERENCES `reference_lists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reference_lists` ADD CONSTRAINT `reference_lists_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reference_lists` ADD CONSTRAINT `reference_lists_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reference_list_items_list_active_idx` ON `reference_list_items` (`listId`,`active`);--> statement-breakpoint
CREATE INDEX `reference_lists_active_idx` ON `reference_lists` (`active`);