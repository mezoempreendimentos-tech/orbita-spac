CREATE TABLE `process_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`workflowStepId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`required` boolean NOT NULL DEFAULT false,
	`assigneeRole` varchar(80),
	`assigneeUserId` int,
	`dueAt` timestamp,
	`completedByUserId` int,
	`completedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `process_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `process_tasks` ADD CONSTRAINT `process_tasks_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_tasks` ADD CONSTRAINT `process_tasks_workflowStepId_workflow_steps_id_fk` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_tasks` ADD CONSTRAINT `process_tasks_assigneeUserId_users_id_fk` FOREIGN KEY (`assigneeUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_tasks` ADD CONSTRAINT `process_tasks_completedByUserId_users_id_fk` FOREIGN KEY (`completedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_tasks` ADD CONSTRAINT `process_tasks_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `process_tasks_process_idx` ON `process_tasks` (`processId`);--> statement-breakpoint
CREATE INDEX `process_tasks_step_idx` ON `process_tasks` (`workflowStepId`);--> statement-breakpoint
CREATE INDEX `process_tasks_assignee_idx` ON `process_tasks` (`assigneeUserId`);--> statement-breakpoint
CREATE INDEX `process_tasks_status_idx` ON `process_tasks` (`status`);