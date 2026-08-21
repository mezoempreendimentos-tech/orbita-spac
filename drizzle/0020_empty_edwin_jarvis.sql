CREATE TABLE `local_password_recovery_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedByUserId` int,
	CONSTRAINT `local_password_recovery_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `local_password_recovery_requests` ADD CONSTRAINT `local_password_recovery_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `local_password_recovery_requests` ADD CONSTRAINT `local_password_recovery_requests_resolvedByUserId_users_id_fk` FOREIGN KEY (`resolvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `local_password_recovery_user_status_idx` ON `local_password_recovery_requests` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `local_password_recovery_requested_idx` ON `local_password_recovery_requests` (`requestedAt`);