CREATE TABLE `google_drive_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleEmail` varchar(320),
	`encryptedRefreshToken` text NOT NULL,
	`grantedScopes` text,
	`rootFolderId` varchar(500),
	`rootFolderUrl` varchar(1000),
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_drive_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_drive_connections_user_uq` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `google_drive_oauth_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`state` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_drive_oauth_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_drive_oauth_states_state_unique` UNIQUE(`state`)
);
--> statement-breakpoint
ALTER TABLE `google_drive_connections` ADD CONSTRAINT `google_drive_connections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_drive_oauth_states` ADD CONSTRAINT `google_drive_oauth_states_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_drive_oauth_states_expires_idx` ON `google_drive_oauth_states` (`expiresAt`);