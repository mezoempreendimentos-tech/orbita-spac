CREATE TABLE `user_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityPublicId` varchar(64) NOT NULL,
	`notificationType` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`status` enum('unread','read') NOT NULL DEFAULT 'unread',
	`idempotencyKey` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_notifications_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `demand_case_events` MODIFY COLUMN `eventType` enum('analysis_started','complementation_requested','complementation_provided','sent_to_presidency','approved','partially_approved','presidency_rejected','returned','procurement_completed') NOT NULL;--> statement-breakpoint
ALTER TABLE `demand_case_events` MODIFY COLUMN `actorUserId` int;--> statement-breakpoint
ALTER TABLE `demands` MODIFY COLUMN `status` enum('draft','submitted','under_review','presidency_review','accepted','partially_accepted','returned','cancelled','rejected','grouped','awaiting_pca_publication','published_in_pca','awaiting_opening','opening_authorized','process_instantiated') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `demand_items` ADD `presidencyDecision` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `demand_items` ADD `presidencyApprovedValue` decimal(14,2);--> statement-breakpoint
ALTER TABLE `demands` ADD `presidencyDecisionNotes` text;--> statement-breakpoint
ALTER TABLE `demands` ADD `presidencyDecidedByUserId` int;--> statement-breakpoint
ALTER TABLE `demands` ADD `presidencyDecidedAt` timestamp;--> statement-breakpoint
ALTER TABLE `demands` ADD `presidencyApprovedValue` decimal(14,2);--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD `closureOutcome` enum('success','failure');--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD `closureNote` text;--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_notifications_recipient_status_idx` ON `user_notifications` (`recipientUserId`,`status`);--> statement-breakpoint
CREATE INDEX `user_notifications_entity_idx` ON `user_notifications` (`entityType`,`entityPublicId`);--> statement-breakpoint
ALTER TABLE `demand_case_events` ADD CONSTRAINT `demand_case_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demands` ADD CONSTRAINT `demands_presidencyDecidedByUserId_users_id_fk` FOREIGN KEY (`presidencyDecidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;