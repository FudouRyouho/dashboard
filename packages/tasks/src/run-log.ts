import type { DB, TaskRunRow } from '@dashboard/db';
import { insertTaskRun, lastTaskRun, listTaskRuns } from '@dashboard/db';
import type { RunLog, TaskRun } from './types';

function rowToTaskRun<Cause extends string>(row: TaskRunRow): TaskRun<Cause> {
  return {
    taskId: row.taskId,
    startedAt: row.startedAt,
    durationMs: row.durationMs,
    outcome: row.outcome,
    cause: (row.cause ?? undefined) as Cause | undefined,
    detail: row.detail ?? undefined,
  };
}

export function createRunLogDB<Cause extends string>(db: DB): RunLog<Cause> {
  return {
    record(run) {
      insertTaskRun(db, {
        taskId: run.taskId,
        startedAt: run.startedAt,
        durationMs: run.durationMs,
        outcome: run.outcome,
        cause: run.cause ?? null,
        detail: run.detail,
      });
    },
    last(taskId) {
      const row = lastTaskRun(db, taskId);
      return row ? rowToTaskRun<Cause>(row) : undefined;
    },
    forTask(taskId) {
      return listTaskRuns(db, taskId).map(rowToTaskRun<Cause>);
    },
    list(taskId, range) {
      return listTaskRuns(db, taskId, range).map(rowToTaskRun<Cause>);
    },
  };
}
