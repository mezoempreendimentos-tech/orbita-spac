CREATE TABLE `local_backup_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp NOT NULL,
	`backupDirectory` varchar(1000),
	`backupSizeBytes` decimal(18,0),
	`errorSummary` text,
	`source` varchar(80) NOT NULL DEFAULT 'windows_powershell',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_backup_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `local_backup_executions_completed_idx` ON `local_backup_executions` (`completedAt`);--> statement-breakpoint
CREATE INDEX `local_backup_executions_status_idx` ON `local_backup_executions` (`status`,`completedAt`);