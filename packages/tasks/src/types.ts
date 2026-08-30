import type { SnapshotKey } from './store';

export interface TaskRun<Cause extends string> {
  taskId: string;
  startedAt: Date;
  durationMs: number;
  outcome: 'success' | 'failure' | 'aborted';
  cause?: Cause;
  detail?: unknown;
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
  cooldownMs: 60 * 60 * 1000, // 1 hora
};
