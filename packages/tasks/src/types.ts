export interface Snapshot<T> {
  data: T;
  obtainedAt: Date;
}

export interface SnapshotKey<T> {
  readonly taskId: string;
  readonly __data?: T;
}

export interface SnapshotStore {
  get<T>(key: SnapshotKey<T>): Snapshot<T> | undefined;
  set<T>(key: SnapshotKey<T>, data: NoInfer<T>): void;
}

export interface TaskRun<Cause extends string> {
  taskId: string;
  startedAt: Date;
  durationMs: number;
  outcome: 'success' | 'failure' | 'aborted';
  cause?: Cause;
  detail?: unknown;
}

export interface RunLog<Cause extends string> {
  record(run: TaskRun<Cause>): void;
  last(taskId: string): TaskRun<Cause> | undefined;
  forTask(taskId: string): TaskRun<Cause>[];
  list(taskId: string, range: { from: Date; to: Date }): TaskRun<Cause>[];
}

export interface FailurePolicy {
  maxAttempts: number;
  cooldownMs: number;
}

export interface TaskDefinition<T = unknown> {
  key: SnapshotKey<T>;
  everyMs: number;
  runOnStart: boolean;
  failurePolicy: FailurePolicy;
  expectedDurationMs: number;
  run: (signal: AbortSignal) => Promise<T>;
}

export type TaskPolicy = Partial<
  Pick<TaskDefinition, 'everyMs' | 'runOnStart' | 'expectedDurationMs'>
> & { failurePolicy?: Partial<FailurePolicy> };

export const BASE_FAILURE_POLICY: FailurePolicy = {
  maxAttempts: 3,
  cooldownMs: 60 * 60 * 1000,
};
