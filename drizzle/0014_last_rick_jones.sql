ALTER TABLE `document_templates` ADD `templateKind` varchar(80) DEFAULT 'checklist' NOT NULL;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `workflowStepKey` varchar(100);--> statement-breakpoint
ALTER TABLE `document_templates` ADD `officialSourceUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `document_templates` ADD `sourceVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `externalTemplateId` varchar(500);--> statement-breakpoint
ALTER TABLE `process_documents` ADD `externalProvider` varchar(80);--> statement-breakpoint
ALTER TABLE `process_documents` ADD `externalFileId` varchar(500);--> statement-breakpoint
ALTER TABLE `process_documents` ADD `externalUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD `externalFolderProvider` varchar(80);--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD `externalFolderId` varchar(500);--> statement-breakpoint
ALTER TABLE `procurement_processes` ADD `externalFolderUrl` varchar(1000);