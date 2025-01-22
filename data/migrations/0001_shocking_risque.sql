CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`object_id` text NOT NULL,
	`filename` text,
	`type` text,
	`hash` text NOT NULL,
	`code` text NOT NULL,
	`due_date` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_code_unique` ON `files` (`code`);