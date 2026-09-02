import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import PQueue from 'p-queue';
import type { RunLog } from './run-log';
import type { SnapshotStore } from './store';
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
  const enCurso = new Map<string, AbortController>();
  let dentroDeRun = 0;
  let parando = false;
  const fallosSeguidos = new Map<string, number>();
  const enEsperaHasta = new Map<string, number>();

  for (const def of definitions) {
    const taskId = def.key.taskId;

    const task = new AsyncTask(taskId, async () => {
      if (parando) return;
      const espera = enEsperaHasta.get(taskId) ?? 0;
      if (Date.now() < espera) return;
      const ac = new AbortController();
      enCurso.set(taskId, ac);
      const startedAt = deps.now();

      try {
        const data = await queue.add(
          async () => {
            dentroDeRun++;
            try {
              return await def.run(ac.signal);
            } finally {
              dentroDeRun--;
            }
          },
          { signal: ac.signal },
        );

        deps.store.set(def.key, data);
        fallosSeguidos.delete(taskId);
        enEsperaHasta.delete(taskId);
        registrar({ outcome: 'success' });
      } catch (err) {
        if (ac.signal.aborted) {
          registrar({ outcome: 'aborted' });
        } else {
          const seguidos = (fallosSeguidos.get(taskId) ?? 0) + 1;
          fallosSeguidos.set(taskId, seguidos);
          if (seguidos >= def.failurePolicy.maxAttempts) {
            enEsperaHasta.set(
              taskId,
              Date.now() + def.failurePolicy.cooldownMs,
            );
          }
          const { cause, detail } = deps.classify(err);
          registrar({ outcome: 'failure', cause, detail });
        }
      } finally {
        if (enCurso.get(taskId) === ac) enCurso.delete(taskId);
      }

      function registrar(extra: Partial<TaskRun<Cause>>) {
        const run: TaskRun<Cause> = {
          taskId,
          startedAt,
          durationMs: Math.max(0, deps.now().getTime() - startedAt.getTime()),
          outcome: 'success',
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
      parando = true;
      scheduler.stop();
      for (const ac of enCurso.values()) ac.abort();
      queue.clear();
      const hasta = Date.now() + (deps.drainMs ?? 2000);
      while (dentroDeRun > 0 && Date.now() < hasta) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
  };
}
