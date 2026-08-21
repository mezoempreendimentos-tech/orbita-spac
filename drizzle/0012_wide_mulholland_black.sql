CREATE TABLE `demand_case_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandId` int NOT NULL,
	`eventType` enum('analysis_started','complementation_requested','complementation_provided','approved','returned') NOT NULL,
	`note` text,
	`actorUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demand_case_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `demand_case_events` ADD CONSTRAINT `dce_demand_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demand_case_events` ADD CONSTRAINT `dce_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `dce_demand_created_idx` ON `demand_case_events` (`demandId`,`createdAt`);