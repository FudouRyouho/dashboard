import type { DB } from '@dashboard/db';
import { purgeTaskRunsOlderThan } from '@dashboard/db';
import type { TaskDefinition } from './types';

export interface CreatePurgeTaskOptions {
  db: DB;
  daysToKeep: number;
  logger?: { info: (obj: object, msg: string) => void };
}

export function createPurgeTask({
  db,
  daysToKeep,
  logger,
}: CreatePurgeTaskOptions): TaskDefinition<number> {
  const cutoffMs = daysToKeep * 24 * 60 * 60 * 1000;
  const everyMs = 24 * 60 * 60 * 1000;

  return {
    key: { taskId: 'purge-task-runs' },
    everyMs,
    runOnStart: true,
    failurePolicy: { maxAttempts: 1, cooldownMs: 60_000 },
    expectedDurationMs: 5000,
    async run() {
      const cutoff = new Date(Date.now() - cutoffMs);
      const result = purgeTaskRunsOlderThan(db, cutoff);
      logger?.info(
        { deleted: result.deleted, cutoff: cutoff.toISOString() },
        'Purged old task runs',
      );
      return result.deleted;
    },
  };
}
