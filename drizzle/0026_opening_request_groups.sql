CREATE TABLE `opening_request_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`declaration` text NOT NULL,
	`alertsFound` boolean NOT NULL DEFAULT false,
	`formalJustification` text,
	`executedByUserId` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opening_request_analyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `opening_request_analyses_version_uq` UNIQUE(`versionId`)
);
--> statement-breakpoint
CREATE TABLE `opening_request_analysis_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`pcaItemId` int NOT NULL,
	`demandId` int,
	`matchType` enum('same_subclass','same_original_subclass','same_base_class','similar_object_terms') NOT NULL,
	`matchingTerms` text,
	`cnaeCode` varchar(32),
	`cnaeBaseCode` varchar(32),
	`estimatedValue` decimal(14,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opening_request_analysis_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opening_request_version_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`pcaItemId` int NOT NULL,
	`demandId` int NOT NULL,
	`demandItemId` int NOT NULL,
	`sequence` int NOT NULL,
	`titleSnapshot` varchar(500) NOT NULL,
	`quantityRequested` decimal(14,4) NOT NULL,
	`availableQuantitySnapshot` decimal(14,4) NOT NULL,
	`unitOfMeasure` varchar(100),
	`estimatedValueSnapshot` decimal(14,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opening_request_version_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `opening_request_version_items_uq` UNIQUE(`versionId`,`pcaItemId`)
);
--> statement-breakpoint
CREATE TABLE `opening_request_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openingRequestId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`pcaId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`integratedObject` text,
	`justification` text NOT NULL,
	`proposedWorkflowType` enum('direct_contracting','bidding') NOT NULL,
	`proposedModality` varchar(120) NOT NULL,
	`cnaeOriginalCode` varchar(32),
	`cnaeOriginalDescription` varchar(1000),
	`cnaeFinalCode` varchar(32) NOT NULL,
	`cnaeFinalDescription` varchar(1000) NOT NULL,
	`cnaeBaseCode` varchar(32),
	`cnaeBaseDescription` varchar(1000),
	`cnaeSourceUrl` varchar(1000),
	`cnaeSourceVersion` varchar(120),
	`analysisAcknowledged` boolean NOT NULL DEFAULT false,
	`analysisAcknowledgedAt` timestamp,
	`analysisAcknowledgedByUserId` int,
	`analysisSummary` text,
	`analysisJustification` text,
	`status` enum('draft','presidency_review','authorized','returned','rejected','instantiated') NOT NULL DEFAULT 'draft',
	`decisionAction` enum('authorize','authorize_different_modality','return','reject'),
	`finalWorkflowType` enum('direct_contracting','bidding'),
	`finalModality` varchar(120),
	`decisionNotes` text,
	`decidedByUserId` int,
	`decidedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opening_request_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `opening_request_versions_uq` UNIQUE(`openingRequestId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `pca_demand_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pcaId` int NOT NULL,
	`demandId` int NOT NULL,
	`demandItemId` int NOT NULL,
	`code` varchar(48) NOT NULL,
	`title` varchar(500) NOT NULL,
	`objectDescription` text,
	`quantity` decimal(14,4) NOT NULL,
	`unitOfMeasure` varchar(100),
	`estimatedValue` decimal(14,2),
	`status` enum('available','in_progress','completed','changed','cancelled') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pca_demand_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `pca_demand_items_origin_uq` UNIQUE(`pcaId`,`demandItemId`)
);
--> statement-breakpoint
CREATE TABLE `procurement_modality_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`previousWorkflowType` enum('direct_contracting','bidding') NOT NULL,
	`previousModality` varchar(120) NOT NULL,
	`proposedWorkflowType` enum('direct_contracting','bidding') NOT NULL,
	`proposedModality` varchar(120) NOT NULL,
	`justification` text NOT NULL,
	`status` enum('presidency_review','authorized','returned','rejected') NOT NULL DEFAULT 'presidency_review',
	`requestedByUserId` int NOT NULL,
	`decidedByUserId` int,
	`decisionNotes` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_modality_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_process_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`openingRequestVersionItemId` int,
	`pcaItemId` int NOT NULL,
	`demandId` int NOT NULL,
	`demandItemId` int NOT NULL,
	`sequence` int NOT NULL,
	`quantityRequested` decimal(14,4) NOT NULL,
	`unitOfMeasure` varchar(100),
	`estimatedValue` decimal(14,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_process_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_process_items_uq` UNIQUE(`processId`,`pcaItemId`)
);
--> statement-breakpoint
ALTER TABLE `opening_requests` DROP INDEX `opening_requests_demand_uq`;--> statement-breakpoint
ALTER TABLE `opening_requests` MODIFY COLUMN `demandId` int;--> statement-breakpoint
ALTER TABLE `annual_plan_items` ADD `quantity` decimal(14,4);--> statement-breakpoint
ALTER TABLE `annual_plan_items` ADD `unitOfMeasure` varchar(100);--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `activeVersionNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `finalWorkflowType` enum('direct_contracting','bidding');--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `finalModality` varchar(120);--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `authorizedAt` timestamp;--> statement-breakpoint
ALTER TABLE `opening_request_analyses` ADD CONSTRAINT `opening_request_analyses_versionId_opening_request_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `opening_request_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_analyses` ADD CONSTRAINT `opening_request_analyses_executedByUserId_users_id_fk` FOREIGN KEY (`executedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_analysis_matches` ADD CONSTRAINT `opening_request_analysis_matches_analysisId_opening_request_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `opening_request_analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_analysis_matches` ADD CONSTRAINT `opening_request_analysis_matches_pcaItemId_pca_demand_items_id_fk` FOREIGN KEY (`pcaItemId`) REFERENCES `pca_demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_analysis_matches` ADD CONSTRAINT `opening_request_analysis_matches_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_version_items` ADD CONSTRAINT `opening_request_version_items_versionId_opening_request_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `opening_request_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_version_items` ADD CONSTRAINT `opening_request_version_items_pcaItemId_pca_demand_items_id_fk` FOREIGN KEY (`pcaItemId`) REFERENCES `pca_demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_version_items` ADD CONSTRAINT `opening_request_version_items_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_version_items` ADD CONSTRAINT `opening_request_version_items_demandItemId_demand_items_id_fk` FOREIGN KEY (`demandItemId`) REFERENCES `demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD CONSTRAINT `opening_request_versions_openingRequestId_opening_requests_id_fk` FOREIGN KEY (`openingRequestId`) REFERENCES `opening_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD CONSTRAINT `opening_request_versions_pcaId_planning_consolidations_id_fk` FOREIGN KEY (`pcaId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD CONSTRAINT `opening_request_versions_analysisAcknowledgedByUserId_users_id_fk` FOREIGN KEY (`analysisAcknowledgedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD CONSTRAINT `opening_request_versions_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD CONSTRAINT `opening_request_versions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_demand_items` ADD CONSTRAINT `pca_demand_items_pcaId_planning_consolidations_id_fk` FOREIGN KEY (`pcaId`) REFERENCES `planning_consolidations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_demand_items` ADD CONSTRAINT `pca_demand_items_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pca_demand_items` ADD CONSTRAINT `pca_demand_items_demandItemId_demand_items_id_fk` FOREIGN KEY (`demandItemId`) REFERENCES `demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_modality_changes` ADD CONSTRAINT `procurement_modality_changes_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_modality_changes` ADD CONSTRAINT `procurement_modality_changes_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_modality_changes` ADD CONSTRAINT `procurement_modality_changes_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_process_items` ADD CONSTRAINT `procurement_process_items_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_process_items` ADD CONSTRAINT `procurement_process_items_openingRequestVersionItemId_opening_request_version_items_id_fk` FOREIGN KEY (`openingRequestVersionItemId`) REFERENCES `opening_request_version_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_process_items` ADD CONSTRAINT `procurement_process_items_pcaItemId_pca_demand_items_id_fk` FOREIGN KEY (`pcaItemId`) REFERENCES `pca_demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_process_items` ADD CONSTRAINT `procurement_process_items_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_process_items` ADD CONSTRAINT `procurement_process_items_demandItemId_demand_items_id_fk` FOREIGN KEY (`demandItemId`) REFERENCES `demand_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `opening_request_analyses_alert_idx` ON `opening_request_analyses` (`alertsFound`);--> statement-breakpoint
CREATE INDEX `opening_request_analysis_matches_analysis_idx` ON `opening_request_analysis_matches` (`analysisId`);--> statement-breakpoint
CREATE INDEX `opening_request_analysis_matches_pca_idx` ON `opening_request_analysis_matches` (`pcaItemId`);--> statement-breakpoint
CREATE INDEX `opening_request_version_items_pca_idx` ON `opening_request_version_items` (`pcaItemId`);--> statement-breakpoint
CREATE INDEX `opening_request_version_items_demand_idx` ON `opening_request_version_items` (`demandId`);--> statement-breakpoint
CREATE INDEX `opening_request_versions_status_idx` ON `opening_request_versions` (`status`);--> statement-breakpoint
CREATE INDEX `opening_request_versions_pca_idx` ON `opening_request_versions` (`pcaId`);--> statement-breakpoint
CREATE INDEX `pca_demand_items_pca_idx` ON `pca_demand_items` (`pcaId`);--> statement-breakpoint
CREATE INDEX `pca_demand_items_demand_idx` ON `pca_demand_items` (`demandId`);--> statement-breakpoint
CREATE INDEX `procurement_modality_changes_process_idx` ON `procurement_modality_changes` (`processId`);--> statement-breakpoint
CREATE INDEX `procurement_modality_changes_status_idx` ON `procurement_modality_changes` (`status`);--> statement-breakpoint
CREATE INDEX `procurement_process_items_pca_idx` ON `procurement_process_items` (`pcaItemId`);--> statement-breakpoint
CREATE INDEX `opening_requests_demand_idx` ON `opening_requests` (`demandId`);
--> statement-breakpoint
/* Backfill dos itens dos PCAs existentes. A origem é composta pelas DFDs vinculadas ao PCA
   (por grupo ou diretamente) e pelas atualizações já publicadas. Itens não aprovados pela
   Presidência não entram no saldo operacional de abertura. */
INSERT INTO `pca_demand_items` (`pcaId`, `demandId`, `demandItemId`, `code`, `title`, `objectDescription`, `quantity`, `unitOfMeasure`, `estimatedValue`, `status`)
SELECT `source`.`pcaId`, `source`.`demandId`, `source`.`demandItemId`,
       CONCAT(LPAD(CAST(ROW_NUMBER() OVER (PARTITION BY `source`.`pcaId` ORDER BY `source`.`demandId`, `source`.`demandItemId`) AS CHAR), 2, '0'), '.', LPAD(CAST(`source`.`sequence` AS CHAR), 2, '0')),
       `source`.`title`, `source`.`objectDescription`, COALESCE(`source`.`quantity`, '1'), COALESCE(`source`.`unitOfMeasure`, 'unidade'), `source`.`estimatedValue`, 'available'
FROM (
  SELECT DISTINCT `pc`.`id` AS `pcaId`, `d`.`id` AS `demandId`, `di`.`id` AS `demandItemId`, `di`.`sequence`, `di`.`title`, `di`.`objectDescription`, `di`.`quantity`, `di`.`unitOfMeasure`, COALESCE(`di`.`presidencyApprovedValue`, `di`.`estimatedValue`) AS `estimatedValue`
  FROM `planning_consolidations` `pc`
  INNER JOIN `planning_consolidation_groups` `pcg` ON `pcg`.`planningConsolidationId` = `pc`.`id`
  INNER JOIN `demand_consolidation_demands` `dcd` ON `dcd`.`demandConsolidationId` = `pcg`.`demandConsolidationId`
  INNER JOIN `demands` `d` ON `d`.`id` = `dcd`.`demandId`
  INNER JOIN `demand_items` `di` ON `di`.`demandId` = `d`.`id`
  WHERE `di`.`presidencyDecision` = 'approved' AND `di`.`confirmed` = 1
  UNION
  SELECT DISTINCT `pc`.`id` AS `pcaId`, `d`.`id` AS `demandId`, `di`.`id` AS `demandItemId`, `di`.`sequence`, `di`.`title`, `di`.`objectDescription`, `di`.`quantity`, `di`.`unitOfMeasure`, COALESCE(`di`.`presidencyApprovedValue`, `di`.`estimatedValue`) AS `estimatedValue`
  FROM `planning_consolidations` `pc`
  INNER JOIN `planning_consolidation_demands` `pcd` ON `pcd`.`consolidationId` = `pc`.`id`
  INNER JOIN `demands` `d` ON `d`.`id` = `pcd`.`demandId`
  INNER JOIN `demand_items` `di` ON `di`.`demandId` = `d`.`id`
  WHERE `di`.`presidencyDecision` = 'approved' AND `di`.`confirmed` = 1
  UNION
  SELECT DISTINCT `pc`.`id` AS `pcaId`, `d`.`id` AS `demandId`, `di`.`id` AS `demandItemId`, `di`.`sequence`, `di`.`title`, `di`.`objectDescription`, `di`.`quantity`, `di`.`unitOfMeasure`, COALESCE(`di`.`presidencyApprovedValue`, `di`.`estimatedValue`) AS `estimatedValue`
  FROM `planning_consolidations` `pc`
  INNER JOIN `pca_updates` `pu` ON `pu`.`pcaId` = `pc`.`id` AND `pu`.`status` = 'published'
  INNER JOIN `pca_update_demands` `pud` ON `pud`.`pcaUpdateId` = `pu`.`id`
  INNER JOIN `demands` `d` ON `d`.`id` = `pud`.`demandId`
  INNER JOIN `demand_items` `di` ON `di`.`demandId` = `d`.`id`
  WHERE `di`.`presidencyDecision` = 'approved' AND `di`.`confirmed` = 1
) `source`
LEFT JOIN `pca_demand_items` `existing` ON `existing`.`pcaId` = `source`.`pcaId` AND `existing`.`demandItemId` = `source`.`demandItemId`
WHERE `existing`.`id` IS NULL;--> statement-breakpoint
ALTER TABLE `opening_request_versions` ADD `revisionJustification` text;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `previousRequestId` int;--> statement-breakpoint
ALTER TABLE `opening_requests` ADD `previousDecisionPublicId` varchar(64);--> statement-breakpoint
CREATE INDEX `opening_requests_previous_request_idx` ON `opening_requests` (`previousRequestId`);--> statement-breakpoint
