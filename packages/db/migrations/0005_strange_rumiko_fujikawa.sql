DROP TABLE IF EXISTS `server_log_entries`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
ALTER TABLE `integration_instances` ADD COLUMN `username` text;--> statement-breakpoint
ALTER TABLE `integration_instances` ADD COLUMN `password` text;--> statement-breakpoint
PRAGMA foreign_keys=ON;
