ALTER TABLE `demand_items` ADD `itemJustification` text;--> statement-breakpoint
ALTER TABLE `demand_items` ADD `quantityJustification` text;--> statement-breakpoint
ALTER TABLE `demand_items` ADD `estimatedValueJustification` text;--> statement-breakpoint
ALTER TABLE `demand_items` ADD `priceResearchCertifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `demands` ADD `supplyLineCnaeCode` varchar(16);--> statement-breakpoint
ALTER TABLE `demands` ADD `supplyLineCnaeDescription` varchar(1000);--> statement-breakpoint
ALTER TABLE `demands` ADD `requesterCertifiedAt` timestamp;