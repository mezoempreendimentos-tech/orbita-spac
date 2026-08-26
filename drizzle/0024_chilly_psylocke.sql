ALTER TABLE `demand_case_events` MODIFY COLUMN `eventType` enum('analysis_started','complementation_requested','complementation_provided','sent_to_presidency','approved','partially_approved','presidency_rejected','financial_classified','returned','procurement_completed') NOT NULL;--> statement-breakpoint
ALTER TABLE `demands` ADD `budgetRubricCode` varchar(32);--> statement-breakpoint
ALTER TABLE `demands` ADD `budgetAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `demands` ADD `budgetAcknowledgedByUserId` int;--> statement-breakpoint
ALTER TABLE `demands` ADD `budgetNote` text;--> statement-breakpoint
ALTER TABLE `demands` ADD CONSTRAINT `demands_budgetAcknowledgedByUserId_users_id_fk` FOREIGN KEY (`budgetAcknowledgedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;