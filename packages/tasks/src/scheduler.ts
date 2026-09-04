import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import PQueue from 'p-queue';
import type { SnapshotStore, RunLog } from './types';
import type { TaskDefinition, TaskRun } from './types';

export interface SchedulerDeps<Cause extends string> {
  store: SnapshotStore;
  runLog: RunLog<Cause>;
  classify: (err: unknown) => { cause: Cause; detail?: unknown };
  now: () => Date;
  concurrency: number;
  drainMs?: number;
  onSuccess?: (run: TaskRun<Cause>) => void;
  onSlow?: (run: TaskRun<Cause>, expectedMs: number) => void;
}

export interface Scheduler {
  stop(): Promise<void>;
}

export function createScheduler<Cause extends string>(
  definitions: TaskDefinition[],
  deps: SchedulerDeps<Cause>,
): Scheduler {
  const scheduler = new ToadScheduler();
  const queue = new PQueue({ concurrency: deps.concurrency });
  const inProgress = new Map<string, AbortController>();
  let withinRun = 0;
  let stopping = false;
  const consecutiveFailures = new Map<string, number>();
  const waitingUtil = new Map<string, number>();

  for (const def of definitions) {
    const taskId = def.key.taskId;

    const task = new AsyncTask(taskId, async () => {
      if (stopping) return;
      const wait = waitingUtil.get(taskId) ?? 0;
      if (deps.now().getTime() < wait) return;
      const ac = new AbortController();
      inProgress.set(taskId, ac);
      const startedAt = deps.now();

      try {
        const data = await queue.add(
          async () => {
            withinRun++;
            try {
              return await def.run(ac.signal);
            } finally {
              withinRun--;
            }
          },
          { signal: ac.signal },
        );

        deps.store.set(def.key, data);
        consecutiveFailures.delete(taskId);
        waitingUtil.delete(taskId);
        registrar({ outcome: 'success' });
      } catch (err) {
        if (ac.signal.aborted) {
          registrar({ outcome: 'aborted' });
        } else {
          const followed = (consecutiveFailures.get(taskId) ?? 0) + 1;
          consecutiveFailures.set(taskId, followed);
          if (followed >= def.failurePolicy.maxAttempts) {
            waitingUtil.set(
              taskId,
              deps.now().getTime() + def.failurePolicy.cooldownMs,
            );
          }
          const { cause, detail } = deps.classify(err);
          registrar({ outcome: 'failure', cause, detail });
        }
      } finally {
        if (inProgress.get(taskId) === ac) inProgress.delete(taskId);
      }

      function registrar(extra: Partial<TaskRun<Cause>>) {
        const run: TaskRun<Cause> = {
          taskId,
          startedAt,
          durationMs: Math.max(0, deps.now().getTime() - startedAt.getTime()),
          outcome: extra.outcome ?? 'success',
          ...extra,
        };
        deps.runLog.record(run);
        if (run.outcome === 'success') {
          deps.onSuccess?.(run);
          if (run.durationMs > def.expectedDurationMs) {
            deps.onSlow?.(run, def.expectedDurationMs);
          }
        }
      }
    });

    scheduler.addSimpleIntervalJob(
      new SimpleIntervalJob(
        { milliseconds: def.everyMs, runImmediately: def.runOnStart },
        task,
        { preventOverrun: true, id: taskId },
      ),
    );
  }

  return {
    async stop() {
      stopping = true;
      scheduler.stop();
      for (const ac of inProgress.values()) ac.abort();
      queue.clear();
      const hasta = deps.now().getTime() + (deps.drainMs ?? 2000);
      while (withinRun > 0 && deps.now().getTime() < hasta) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
  };
}
