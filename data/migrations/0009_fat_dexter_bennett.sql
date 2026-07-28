ALTER TABLE `files` ADD `storage_provider` text DEFAULT 'kv' NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `claimed_at` integer;--> statement-breakpoint
CREATE INDEX `files_due_date_idx` ON `files` (`due_date`);--> statement-breakpoint
CREATE INDEX `files_created_at_idx` ON `files` (`created_at`);
