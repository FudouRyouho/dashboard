import { eq } from 'drizzle-orm';
import type { DB } from '../connection';
import { taskSnapshots } from '../schemas/tasks';

export interface TaskSnapshotRow {
  taskId: string;
  data: unknown;
  obtainedAt: Date;
}

export function getTaskSnapshot(
  db: DB,
  taskId: string,
): TaskSnapshotRow | undefined {
  const row = db
    .select()
    .from(taskSnapshots)
    .where(eq(taskSnapshots.taskId, taskId))
    .get();
  if (!row) return undefined;
  return {
    taskId: row.taskId,
    data: JSON.parse(row.data),
    obtainedAt: row.obtainedAt,
  };
}

export function upsertTaskSnapshot(
  db: DB,
  taskId: string,
  data: unknown,
): void {
  const now = new Date();
  db.insert(taskSnapshots)
    .values({
      taskId,
      data: JSON.stringify(data),
      obtainedAt: now,
    })
    .onConflictDoUpdate({
      target: taskSnapshots.taskId,
      set: {
        data: JSON.stringify(data),
        obtainedAt: now,
      },
    })
    .run();
}
