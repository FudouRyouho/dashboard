CREATE TABLE `task_runs` (
	`task_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`outcome` text NOT NULL,
	`cause` text,
	`detail` text,
	PRIMARY KEY(`task_id`, `started_at`)
);
--> statement-breakpoint
CREATE INDEX `idx_task_runs_task_id` ON `task_runs` (`task_id`);--> statement-breakpoint
CREATE TABLE `task_snapshots` (
	`task_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`obtained_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `server_log_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`level` text NOT NULL,
	`source` text,
	`message` text NOT NULL,
	`detail` text
);
--> statement-breakpoint
CREATE TABLE `integration_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`external_url` text,
	`created_at` integer NOT NULL
);
