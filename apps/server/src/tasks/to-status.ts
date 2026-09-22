import { IntegrationErrorReason, ResultStatus } from '@dashboard/contracts';
import { Snapshot, TaskRun } from '@dashboard/tasks';

interface SnapshotWithTaskId extends Snapshot<unknown> {
  taskId?: string;
}

export function toStatus(
  snapshot: Snapshot<unknown> | undefined,
  lastRun: TaskRun<IntegrationErrorReason> | undefined,
): ResultStatus {
  // Validate that snapshot and lastRun belong to the same task
  if (snapshot && lastRun) {
    const snapshotWithTaskId = snapshot as SnapshotWithTaskId;
    if (snapshotWithTaskId.taskId && snapshotWithTaskId.taskId !== lastRun.taskId) {
      console.warn(
        `[toStatus] Task ID mismatch: snapshot.taskId=${snapshotWithTaskId.taskId} !== lastRun.taskId=${lastRun.taskId}. Treating as no lastRun.`,
      );
      // Treat as if no lastRun when task IDs don't match
      lastRun = undefined;
    } else if (!snapshotWithTaskId.taskId) {
      console.warn(
        `[toStatus] Snapshot missing taskId, cannot verify task ownership. Treating as no lastRun.`,
      );
      // Treat as if no lastRun when we can't verify
      lastRun = undefined;
    }
  }

  return {
    data: snapshot ? { obtainedAt: snapshot.obtainedAt.toISOString() } : null,
    attempt: !lastRun
      ? null
      : lastRun.outcome === 'success'
        ? { outcome: 'success', at: lastRun.startedAt.toISOString() }
        : {
            outcome: 'failure',
            at: lastRun.startedAt.toISOString(),
            reason: lastRun.cause ?? 'unknown',
          },
  };
}
