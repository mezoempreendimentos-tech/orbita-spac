CREATE TABLE `demand_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandId` int NOT NULL,
	`sequence` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`objectDescription` text NOT NULL,
	`quantity` decimal(14,4),
	`unitOfMeasure` varchar(100),
	`estimatedValue` decimal(14,2),
	`confirmed` boolean NOT NULL DEFAULT true,
	`confirmedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demand_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `demand_items_demand_sequence_uq` UNIQUE(`demandId`,`sequence`)
);
--> statement-breakpoint
ALTER TABLE `demand_items` ADD CONSTRAINT `demand_item_demand_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `demand_items_demand_idx` ON `demand_items` (`demandId`);