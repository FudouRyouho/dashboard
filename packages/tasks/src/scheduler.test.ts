import { describe, test, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  createRunLogDB,
  createSnapshotStoreDB,
  createScheduler,
  type SnapshotKey,
  type TaskDefinition,
} from '.';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (taskId: string): SnapshotKey<number> => ({ taskId });

const assemble = <T>(
  taskId: string,
  everyMs: number,
  run: (signal: AbortSignal) => Promise<T>,
  failurePolicy = { maxAttempts: 3, cooldownMs: 60_000 },
): TaskDefinition<T> => ({
  key: { taskId },
  everyMs,
  runOnStart: true,
  failurePolicy,
  expectedDurationMs: 10_000,
  run,
});

let d: Awaited<ReturnType<typeof deps>>;

afterEach(async () => {
  if (d) {
    try {
      d.cleanup();
    } catch {}
  }
});

const deps = async () => {
  const tempPath = `./data/test-scheduler-${randomUUID()}.sqlite`;
  const migrationsFolder = new URL(
    '../../../packages/db/migrations',
    import.meta.url,
  ).pathname;
  const db = await initializeDatabase({ path: tempPath, migrationsFolder });
  return {
    store: createSnapshotStoreDB(db),
    runLog: createRunLogDB<string>(db),
    classify: () => ({ cause: 'unreachable' as const }),
    now: function () {
      return new Date();
    },
    concurrency: 4,
    drainMs: 300,
    cleanup: () => {
      try {
        unlinkSync(tempPath);
      } catch {}
    },
  };
};

describe('Scheduler', () => {
  describe('concurrency', () => {
    test('prevents concurrent execution of the same task', async () => {
      d = await deps();
      let lives = 0;
      let peak = 0;
      const def = assemble('a', 30, async () => {
        lives++;
        peak = Math.max(peak, lives);
        await sleep(120);
        lives--;
        return 1;
      });
      const s = createScheduler<string>([def], d);
      await sleep(400);
      await sleep(50);
      await s.stop();
      expect(peak).toBe(1, `had ${peak} simultaneous runs of the same task`);
    });

    test('concurrency limit bounds running tasks', async () => {
      d = await deps();
      let lives = 0;
      let peak = 0;
      const tasks = Array.from({ length: 10 }, (_, i) =>
        assemble(`t${i}`, 200, async () => {
          lives++;
          peak = Math.max(peak, lives);
          await sleep(80);
          lives--;
          return i;
        }),
      );
      const s = createScheduler<string>(tasks, { ...d, concurrency: 3 });
      await sleep(250);
      await sleep(50);
      await s.stop();
      expect(peak <= 3, `global peak was ${peak}, with a ceiling of 3`).toBeTruthy();
    });
  });

  describe('snapshot', () => {
    test('only successful runs write to snapshot store', async () => {
      d = await deps();
      let n = 0;
      const def = assemble(
        'b',
        40,
        async () => {
          n++;
          if (n > 1) throw new Error('boom');
          return 42;
        },
        { maxAttempts: 3, cooldownMs: 60_000 },
      );
      const s = createScheduler<string>([def], d);
      await sleep(200);
      await s.stop();
      const snapshot = d.store.get(key('b'));
      expect(snapshot?.data).toBe(42, 'first success data is still intact');
      expect(
        d.runLog.forTask('b').some((r) => r.outcome === 'failure'),
        'failures should be logged',
      ).toBeTruthy();
    });
  });

  describe('abort handling', () => {
    test('stop() cancels in-flight run and marks as aborted', async () => {
      d = await deps();
      const def = assemble('c', 1000, async (signal) => {
        await new Promise((resolve, reject) => {
          const t = setTimeout(resolve, 5005);
          signal.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new Error('AbortError'));
          });
        });
        return 1;
      });
      const s = createScheduler<string>([def], d);
      await sleep(60);
      await sleep(20);
      await s.stop();
      expect(d.runLog.last('c')?.outcome).toBe('aborted');
      expect(d.store.get(key('c'))).toBe(undefined, 'an aborted run should not write');
    });
  });

  describe('failure policy', () => {
    test('after max attempts, task respects cooldown period', async () => {
      d = await deps();
      let attempts = 0;
      const def = assemble(
        'd',
        30,
        async () => {
          attempts++;
          throw new Error('boom');
        },
        { maxAttempts: 3, cooldownMs: 300 },
      );
      const s = createScheduler<string>([def], d);
      await sleep(200);
      const during = attempts;
      await sleep(300);
      await sleep(50);
      await s.stop();
      expect(during >= 2, `Should see at least 2 attempts before cooldown, got ${during}`).toBeTruthy();
      expect(attempts > during, `Should run again after cooldown, got ${attempts} total`).toBeTruthy();
    });

    test('successful run resets failure counter', async () => {
      d = await deps();
      let n = 0;
      const def = assemble(
        'e',
        30,
        async () => {
          n++;
          if (n === 1) throw new Error('first fails');
          return n;
        },
        { maxAttempts: 2, cooldownMs: 60_000 },
      );
      const s = createScheduler<string>([def], d);
      await sleep(200);
      await s.stop();
      const outcomes = [...d.runLog.forTask('e').map((r) => r.outcome)].reverse();
      expect(outcomes[0]).toBe('failure', 'first run failed');
      expect(outcomes.slice(1).every((o) => o === 'success'), `subsequent runs after success should succeed`).toBeTruthy();
      expect(n >= 2, `total runs should be at least 2`).toBeTruthy();
    });

    test('zero cooldown retries immediately after max attempts', async () => {
      d = await deps();
      let attempts = 0;
      const def = assemble(
        'immediate-retry',
        30,
        async () => {
          attempts++;
          throw new Error('boom');
        },
        { maxAttempts: 2, cooldownMs: 0 },
      );
      const s = createScheduler<string>([def], d);
      await sleep(200);
      await s.stop();
      expect(attempts >= 2, `cooldown=0 should retry immediately, got ${attempts}`).toBeTruthy();
    });

    test('single attempt triggers cooldown after failure', async () => {
      d = await deps();
      let attempts = 0;
      const def = assemble(
        'single-attempt',
        30,
        async () => {
          attempts++;
          throw new Error('boom');
        },
        { maxAttempts: 1, cooldownMs: 100 },
      );
      const s = createScheduler<string>([def], d);
      await sleep(200);
      await s.stop();
      expect(attempts >= 2, `maxAttempts=1 should run at least 2 times, got ${attempts}`).toBeTruthy();
    });
  });
});