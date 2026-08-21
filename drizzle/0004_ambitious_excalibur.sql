CREATE TABLE `governance_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(80) NOT NULL,
	`settingKey` varchar(120) NOT NULL,
	`label` varchar(255) NOT NULL,
	`value` text,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governance_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `governance_settings` ADD CONSTRAINT `governance_settings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `governance_settings_category_idx` ON `governance_settings` (`category`);