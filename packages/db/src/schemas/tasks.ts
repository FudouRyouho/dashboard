import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';

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
