import { IntegrationErrorReason, ResultStatus } from '@dashboard/contracts';
import { Snapshot, TaskRun } from '@dashboard/tasks';

export function toStatus(
  snapshot: Snapshot<unknown> | undefined,
  lastRun: TaskRun<IntegrationErrorReason> | undefined,
): ResultStatus {
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
