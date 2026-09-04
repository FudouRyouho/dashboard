import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { DB } from '../connection';
import { taskRuns } from '../schemas/tasks';

export type TaskRunOutcome = 'success' | 'failure' | 'aborted';

export interface InsertTaskRunInput {
  taskId: string;
  startedAt: Date;
  durationMs: number;
  outcome: TaskRunOutcome;
  cause?: string | null;
  detail?: unknown;
}

export interface TaskRunRow {
  taskId: string;
  startedAt: Date;
  durationMs: number;
  outcome: TaskRunOutcome;
  cause: string | null;
  detail: unknown;
}

function rowToTaskRun(row: {
  taskId: string;
  startedAt: Date;
  durationMs: number;
  outcome: string;
  cause: string | null;
  detail: string | null;
}): TaskRunRow {
  return {
    taskId: row.taskId,
    startedAt: row.startedAt,
    durationMs: row.durationMs,
    outcome: row.outcome as TaskRunOutcome,
    cause: row.cause,
    detail: row.detail !== null ? JSON.parse(row.detail) : null,
  };
}

export function insertTaskRun(db: DB, run: InsertTaskRunInput): void {
  db.insert(taskRuns)
    .values({
      taskId: run.taskId,
      startedAt: run.startedAt,
      durationMs: run.durationMs,
      outcome: run.outcome,
      cause: run.cause ?? null,
      detail: run.detail != null ? JSON.stringify(run.detail) : null,
    })
    .run();
}

export function listTaskRuns(
  db: DB,
  taskId: string,
  range?: { from: Date; to: Date },
): TaskRunRow[] {
  const conds = [eq(taskRuns.taskId, taskId)];
  if (range) {
    conds.push(gte(taskRuns.startedAt, range.from));
    conds.push(lte(taskRuns.startedAt, range.to));
  }
  const rows = db
    .select()
    .from(taskRuns)
    .where(and(...conds))
    .orderBy(desc(taskRuns.startedAt))
    .all();
  return rows.map(rowToTaskRun);
}

export function lastTaskRun(db: DB, taskId: string): TaskRunRow | undefined {
  const rows = listTaskRuns(db, taskId);
  return rows[0];
}

export function purgeTaskRunsOlderThan(
  db: DB,
  cutoff: Date,
): { deleted: number } {
  const result = db
    .delete(taskRuns)
    .where(lte(taskRuns.startedAt, cutoff))
    .run();
  return { deleted: result.changes };
}
