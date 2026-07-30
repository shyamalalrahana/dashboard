ALTER TABLE `sessions` ADD `last_seen_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `failed_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `locked_until` integer;