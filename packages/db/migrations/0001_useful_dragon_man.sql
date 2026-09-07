ALTER TABLE `integration_instances` ADD `api_key` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `integration_instances` ADD `port` integer;--> statement-breakpoint
ALTER TABLE `integration_instances` ADD `updated_at` integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
CREATE UNIQUE INDEX `idx_integrations_kind_name` ON `integration_instances` (`kind`, `name`);