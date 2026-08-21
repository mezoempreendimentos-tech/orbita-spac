CREATE TABLE `document_signature_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`provider` enum('govbr') NOT NULL DEFAULT 'govbr',
	`documentScope` enum('planning','process') NOT NULL,
	`planningDocumentId` int,
	`processDocumentId` int,
	`status` enum('awaiting_credentials','ready_for_authorization','authorization_requested','signed','failed','cancelled') NOT NULL DEFAULT 'awaiting_credentials',
	`contentHashSha256` varchar(128),
	`signatureStorageKey` varchar(700),
	`signatureStorageUrl` varchar(1000),
	`externalSignatureId` varchar(500),
	`requestedByUserId` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`signedAt` timestamp,
	`failureReason` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_signature_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_signature_requests_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
ALTER TABLE `document_signature_requests` ADD CONSTRAINT `dsr_plan_doc_fk` FOREIGN KEY (`planningDocumentId`) REFERENCES `planning_documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_signature_requests` ADD CONSTRAINT `dsr_proc_doc_fk` FOREIGN KEY (`processDocumentId`) REFERENCES `process_documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_signature_requests` ADD CONSTRAINT `dsr_requester_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `dsr_planning_idx` ON `document_signature_requests` (`planningDocumentId`);--> statement-breakpoint
CREATE INDEX `dsr_process_idx` ON `document_signature_requests` (`processDocumentId`);--> statement-breakpoint
CREATE INDEX `dsr_status_idx` ON `document_signature_requests` (`status`);
