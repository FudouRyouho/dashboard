import type { DB } from '@dashboard/db';
import { purgeTaskRunsOlderThan } from '@dashboard/db';
import type { TaskDefinition } from './types';

export function createPurgeTask(
  db: DB,
  daysToKeep: number,
): TaskDefinition<number> {
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
      console.log(
        `[purge] Eliminadas ${result.deleted} corridas anteriores a ${cutoff.toISOString()}`,
      );
      return result.deleted;
    },
  };
}
