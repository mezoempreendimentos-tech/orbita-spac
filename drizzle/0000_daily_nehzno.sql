CREATE TABLE `annual_plan_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`code` varchar(48) NOT NULL,
	`title` varchar(500) NOT NULL,
	`requestingUnitId` int,
	`estimatedValue` decimal(14,2),
	`status` enum('planned','in_progress','completed','changed','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annual_plan_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `annual_plan_items_plan_code_uq` UNIQUE(`planId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `annual_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fiscalYear` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annual_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `annual_plans_year_uq` UNIQUE(`fiscalYear`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int,
	`actorUserId` int,
	`eventType` varchar(120) NOT NULL,
	`summary` varchar(1000) NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(48) NOT NULL,
	`requestingUnitId` int NOT NULL,
	`requesterUserId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`objectDescription` text NOT NULL,
	`justification` text NOT NULL,
	`quantity` decimal(14,2),
	`unitOfMeasure` varchar(100),
	`initialEstimatedValue` decimal(14,2),
	`desiredContractDate` timestamp,
	`deliveryPeriod` varchar(255),
	`annualPlanItemId` int,
	`isSupervening` boolean NOT NULL DEFAULT false,
	`planningJustification` text,
	`status` enum('draft','submitted','under_review','accepted','returned','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `demands_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`documentType` varchar(120) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`content` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_templates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `organizational_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(48) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizational_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizational_units_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `process_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`workflowStepId` int,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(500) NOT NULL,
	`dueAt` timestamp,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`resolvedByUserId` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `process_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `process_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`workflowStepId` int,
	`decisionType` enum('approval','return','waiver','budget','legal_opinion','authorization','annulment','revocation','supplier_selection') NOT NULL,
	`outcome` varchar(120) NOT NULL,
	`justification` text NOT NULL,
	`targetStepKey` varchar(100),
	`decidedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `process_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `process_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`workflowStepId` int,
	`documentType` varchar(120) NOT NULL,
	`title` varchar(500) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','under_review','approved','superseded','published','rejected') NOT NULL DEFAULT 'draft',
	`storageKey` varchar(700),
	`storageUrl` varchar(1000),
	`mimeType` varchar(150),
	`sizeBytes` int,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `process_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `process_publications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`documentId` int,
	`publicationType` varchar(120) NOT NULL,
	`destination` enum('pncp','official_site','tce_mural','internal') NOT NULL,
	`status` enum('pending','ready','sent','confirmed','failed','waived') NOT NULL DEFAULT 'pending',
	`dueAt` timestamp,
	`sentAt` timestamp,
	`confirmationReference` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `process_publications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_processes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`demandId` int NOT NULL,
	`workflowType` enum('direct_contracting','bidding') NOT NULL,
	`modality` varchar(120),
	`title` varchar(500) NOT NULL,
	`currentStepKey` varchar(100),
	`currentResponsibleRole` varchar(80),
	`status` enum('draft','active','blocked','suspended','authorized','contracted','archived','annulled','revoked','cancelled') NOT NULL DEFAULT 'draft',
	`estimatedValue` decimal(14,2),
	`createdByUserId` int NOT NULL,
	`startedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procurement_processes_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_processes_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `supplier_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`supplierId` int NOT NULL,
	`offeredValue` decimal(14,2) NOT NULL,
	`status` enum('received','under_review','qualified','disqualified','selected','withdrawn') NOT NULL DEFAULT 'received',
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legalName` varchar(500) NOT NULL,
	`taxId` varchar(32) NOT NULL,
	`email` varchar(320),
	`phone` varchar(48),
	`status` enum('active','pending_review','restricted','inactive') NOT NULL DEFAULT 'pending_review',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_taxId_unique` UNIQUE(`taxId`)
);
--> statement-breakpoint
CREATE TABLE `user_process_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unitId` int,
	`role` enum('demandante','chefia_compras','compras','instrumentalizacao','contabilidade','juridico','agente_contratacao','autoridade_competente','gestao_contratos','fiscal_contrato','administrador') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_process_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_process_roles_user_unit_role_uq` UNIQUE(`userId`,`unitId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workflow_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`workflowStepId` int,
	`code` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`required` boolean NOT NULL DEFAULT true,
	`status` enum('pending','completed','waived','not_applicable') NOT NULL DEFAULT 'pending',
	`notes` text,
	`completedByUserId` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_checklists_step_code_uq` UNIQUE(`workflowStepId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`stepKey` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`module` varchar(80) NOT NULL,
	`sequence` int NOT NULL,
	`status` enum('waiting','ready','in_progress','completed','returned','skipped','blocked') NOT NULL DEFAULT 'waiting',
	`required` boolean NOT NULL DEFAULT true,
	`assigneeRole` varchar(80) NOT NULL,
	`assigneeUserId` int,
	`dueAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`completionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_steps_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_steps_process_key_uq` UNIQUE(`processId`,`stepKey`)
);
--> statement-breakpoint
ALTER TABLE `annual_plan_items` ADD CONSTRAINT `annual_plan_items_planId_annual_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `annual_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `annual_plan_items` ADD CONSTRAINT `annual_plan_items_requestingUnitId_organizational_units_id_fk` FOREIGN KEY (`requestingUnitId`) REFERENCES `organizational_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demands` ADD CONSTRAINT `demands_requestingUnitId_organizational_units_id_fk` FOREIGN KEY (`requestingUnitId`) REFERENCES `organizational_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demands` ADD CONSTRAINT `demands_requesterUserId_users_id_fk` FOREIGN KEY (`requesterUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demands` ADD CONSTRAINT `demands_annualPlanItemId_annual_plan_items_id_fk` FOREIGN KEY (`annualPlanItemId`) REFERENCES `annual_plan_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_templates` ADD CONSTRAINT `document_templates_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_alerts` ADD CONSTRAINT `process_alerts_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_alerts` ADD CONSTRAINT `process_alerts_workflowStepId_workflow_steps_id_fk` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_alerts` ADD CONSTRAINT `process_alerts_resolvedByUserId_users_id_fk` FOREIGN KEY (`resolvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_decisions` ADD CONSTRAINT `process_decisions_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_decisions` ADD CONSTRAINT `process_decisions_workflowStepId_workflow_steps_id_fk` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_decisions` ADD CONSTRAINT `process_decisions_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_documents` ADD CONSTRAINT `process_documents_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_documents` ADD CONSTRAINT `process_documents_workflowStepId_workflow_steps_id_fk` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_documents` ADD CONSTRAINT `process_documents_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_publications` ADD CONSTRAINT `process_publications_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_publications` ADD CONSTRAINT `process_publications_documentId_process_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `process_documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD CONSTRAINT `procurement_processes_demandId_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `demands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD CONSTRAINT `procurement_processes_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_proposals` ADD CONSTRAINT `supplier_proposals_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_proposals` ADD CONSTRAINT `supplier_proposals_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_process_roles` ADD CONSTRAINT `user_process_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_process_roles` ADD CONSTRAINT `user_process_roles_unitId_organizational_units_id_fk` FOREIGN KEY (`unitId`) REFERENCES `organizational_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_checklists` ADD CONSTRAINT `workflow_checklists_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_checklists` ADD CONSTRAINT `workflow_checklists_workflowStepId_workflow_steps_id_fk` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_checklists` ADD CONSTRAINT `workflow_checklists_completedByUserId_users_id_fk` FOREIGN KEY (`completedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_steps` ADD CONSTRAINT `workflow_steps_processId_procurement_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `procurement_processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_steps` ADD CONSTRAINT `workflow_steps_assigneeUserId_users_id_fk` FOREIGN KEY (`assigneeUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `annual_plan_items_status_idx` ON `annual_plan_items` (`status`);--> statement-breakpoint
CREATE INDEX `audit_events_process_idx` ON `audit_events` (`processId`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_events_type_idx` ON `audit_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `process_alerts_process_idx` ON `process_alerts` (`processId`);--> statement-breakpoint
CREATE INDEX `process_alerts_status_idx` ON `process_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `process_decisions_process_idx` ON `process_decisions` (`processId`);--> statement-breakpoint
CREATE INDEX `process_decisions_type_idx` ON `process_decisions` (`decisionType`);--> statement-breakpoint
CREATE INDEX `process_documents_process_idx` ON `process_documents` (`processId`);--> statement-breakpoint
CREATE INDEX `process_documents_step_idx` ON `process_documents` (`workflowStepId`);--> statement-breakpoint
CREATE INDEX `process_publications_process_idx` ON `process_publications` (`processId`);--> statement-breakpoint
CREATE INDEX `process_publications_status_idx` ON `process_publications` (`status`);--> statement-breakpoint
CREATE INDEX `procurement_processes_status_idx` ON `procurement_processes` (`status`);--> statement-breakpoint
CREATE INDEX `procurement_processes_current_step_idx` ON `procurement_processes` (`currentStepKey`);--> statement-breakpoint
CREATE INDEX `procurement_processes_demand_idx` ON `procurement_processes` (`demandId`);--> statement-breakpoint
CREATE INDEX `supplier_proposals_process_idx` ON `supplier_proposals` (`processId`);--> statement-breakpoint
CREATE INDEX `user_process_roles_user_idx` ON `user_process_roles` (`userId`);--> statement-breakpoint
CREATE INDEX `workflow_checklists_process_idx` ON `workflow_checklists` (`processId`);--> statement-breakpoint
CREATE INDEX `workflow_steps_assignee_idx` ON `workflow_steps` (`assigneeUserId`);--> statement-breakpoint
CREATE INDEX `workflow_steps_status_idx` ON `workflow_steps` (`status`);