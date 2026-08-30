import type { TaskRun } from './types';

export interface RunLog<Cause extends string> {
  record(run: TaskRun<Cause>): void;
  last(taskId: string): TaskRun<Cause> | undefined;
  forTask(taskId: string): TaskRun<Cause>[];
}

export function createRunLog<Cause extends string>(
  capacityPerTask: number,
): RunLog<Cause> {
  const byTask = new Map<string, TaskRun<Cause>[]>();

  return {
    record(run) {
      const runs = byTask.get(run.taskId) ?? [];
      runs.push(run);
      if (runs.length > capacityPerTask) runs.shift();
      byTask.set(run.taskId, runs);
    },
    last(taskId) {
      const runs = byTask.get(taskId);
      return runs?.[runs.length - 1];
    },
    forTask(taskId) {
      return [...(byTask.get(taskId) ?? [])];
    },
  };
}
