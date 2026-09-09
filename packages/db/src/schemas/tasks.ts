import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';
import { integrationInstances } from './integrations';

export const taskRuns = sqliteTable(
  'task_runs',
  {
    taskId: text('task_id').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    durationMs: integer('duration_ms').notNull(),
    outcome: text('outcome', {
      enum: ['success', 'failure', 'aborted'],
    }).notNull(),
    cause: text('cause'),
    detail: text('detail'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.startedAt] }),
    idxTaskId: index('idx_task_runs_task_id').on(t.taskId),
  }),
);

export const taskSnapshots = sqliteTable('task_snapshots', {
  taskId: text('task_id').primaryKey(),
  data: text('data').notNull(),
  obtainedAt: integer('obtained_at', { mode: 'timestamp_ms' }).notNull(),
});

export const taskPolicies = sqliteTable('task_policies', {
  id: text('id').primaryKey(),
  integrationId: text('integration_id').notNull().references(() => integrationInstances.id, { onDelete: 'cascade' }),
  taskType: text('task_type', { enum: ['calendar', 'mediaReleases'] }).notNull(),
  everyMs: integer('every_ms').notNull(),
  runOnStart: integer('run_on_start').notNull(),
  expectedDurationMs: integer('expected_duration_ms').notNull(),
  failureMaxAttempts: integer('failure_max_attempts').notNull(),
  failureCooldownMs: integer('failure_cooldown_ms').notNull(),
}, (t) => ({
  uniq: index('uniq_task_policies_integration_task').on(t.integrationId, t.taskType),
}));
