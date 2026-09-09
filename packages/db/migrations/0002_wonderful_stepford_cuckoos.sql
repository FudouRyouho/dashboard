CREATE TABLE `task_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`task_type` text NOT NULL,
	`every_ms` integer NOT NULL,
	`run_on_start` integer NOT NULL,
	`expected_duration_ms` integer NOT NULL,
	`failure_max_attempts` integer NOT NULL,
	`failure_cooldown_ms` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `integration_instances`(`id`) ON UPDATE no action ON DELETE cascade,
	UNIQUE (`integration_id`, `task_type`)
);
--> statement-breakpoint
CREATE INDEX `idx_task_policies_integration_id` ON `task_policies` (`integration_id`);