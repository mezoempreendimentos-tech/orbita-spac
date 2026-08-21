CREATE TABLE `privacy_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`status` enum('not_started','in_review','approved','needs_changes','risk_accepted','not_applicable') NOT NULL DEFAULT 'not_started',
	`containsPersonalData` boolean NOT NULL DEFAULT false,
	`containsSensitiveData` boolean NOT NULL DEFAULT false,
	`containsVulnerableData` boolean NOT NULL DEFAULT false,
	`largeScale` boolean NOT NULL DEFAULT false,
	`publicAreaMonitoring` boolean NOT NULL DEFAULT false,
	`solelyAutomatedDecision` boolean NOT NULL DEFAULT false,
	`externalSharing` boolean NOT NULL DEFAULT false,
	`internationalTransfer` boolean NOT NULL DEFAULT false,
	`treatmentDescription` text,
	`dataCategories` text,
	`dataSubjectCategories` text,
	`dataSource` text,
	`purpose` text,
	`legalBasis` varchar(180),
	`necessityAssessment` text,
	`retentionPolicy` text,
	`disposalMethod` text,
	`securityMeasures` text,
	`riskLevel` enum('unknown','low','medium','high') NOT NULL DEFAULT 'unknown',
	`ripdRecommended` boolean NOT NULL DEFAULT false,
	`dpoConsulted` boolean NOT NULL DEFAULT false,
	`dpoOpinion` text,
	`reviewDueAt` timestamp,
	`lastReviewedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`decidedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `privacy_assessments_process_uq` UNIQUE(`processId`)
);
--> statement-breakpoint
CREATE TABLE `privacy_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`outcome` enum('approved','needs_changes','risk_accepted','not_applicable') NOT NULL,
	`justification` text NOT NULL,
	`decidedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacy_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`probability` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`impact` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`residualRisk` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`mitigation` text,
	`ownerRole` varchar(80),
	`status` enum('open','in_treatment','mitigated','accepted') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `privacy_assessments` ADD CONSTRAINT `privacy_assessments_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_assessments` ADD CONSTRAINT `privacy_assessments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_assessments` ADD CONSTRAINT `privacy_assessments_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_decisions` ADD CONSTRAINT `privacy_decisions_assessmentId_privacy_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `privacy_assessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_decisions` ADD CONSTRAINT `privacy_decisions_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_risks` ADD CONSTRAINT `privacy_risks_assessmentId_privacy_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `privacy_assessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `privacy_assessments_status_idx` ON `privacy_assessments` (`status`);--> statement-breakpoint
CREATE INDEX `privacy_assessments_risk_idx` ON `privacy_assessments` (`riskLevel`);--> statement-breakpoint
CREATE INDEX `privacy_decisions_assessment_idx` ON `privacy_decisions` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `privacy_risks_assessment_idx` ON `privacy_risks` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `privacy_risks_status_idx` ON `privacy_risks` (`status`);