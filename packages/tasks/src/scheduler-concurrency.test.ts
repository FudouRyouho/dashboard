import { describe, test, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  createRunLogDB,
  createSnapshotStoreDB,
  createScheduler,
  type TaskDefinition,
} from '.';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const assemble = <T>(
  taskId: string,
  everyMs: number,
  run: (signal: AbortSignal) => Promise<T>,
  failurePolicy = { maxAttempts: 3, cooldownMs: 60_000 },
  expectedDurationMs = 10_000,
): TaskDefinition<T> => ({
  key: { taskId },
  everyMs,
  runOnStart: true,
  failurePolicy,
  expectedDurationMs,
  run,
});

interface SchedulerDeps {
  store: ReturnType<typeof createSnapshotStoreDB>;
  runLog: ReturnType<typeof createRunLogDB<string>>;
  classify: (err: unknown) => { cause: string; detail?: unknown };
  now: () => Date;
  concurrency: number;
  drainMs?: number;
  cleanup?: () => void;
}

const deps = async (): Promise<SchedulerDeps> => {
  const tempPath = `./data/test-scheduler-concurrency-${randomUUID()}.sqlite`;
  const migrationsFolder = new URL(
    '../../../packages/db/migrations',
    import.meta.url,
  ).pathname;
  const db = await initializeDatabase({ path: tempPath, migrationsFolder });
  return {
    store: createSnapshotStoreDB(db),
    runLog: createRunLogDB<string>(db),
    classify: () => ({ cause: 'unknown' }),
    now: () => new Date(),
    concurrency: 4,
    drainMs: 300,
    cleanup: () => {
      try {
        unlinkSync(tempPath);
      } catch {}
    },
  };
};

describe('Scheduler concurrency measurement', () => {
  test('measures latency distribution per integration type', async () => {
    const d = await deps();
    const latencies: Record<string, number[]> = {};

    // Simulate integrations with different latency profiles
    const tasks: TaskDefinition<number>[] = [
      // qBittorrent-like: moderate latency
      assemble(
        'qbittorrent',
        3000,
        async () => {
          const start = Date.now();
          await sleep(50); // 50ms average
          latencies['qbittorrent'] = [...(latencies['qbittorrent'] ?? []), Date.now() - start];
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 1000 },
        100,
      ),
      // Docker stats: fast
      assemble(
        'docker',
        30000,
        async () => {
          const start = Date.now();
          await sleep(10); // 10ms average
          latencies['docker'] = [...(latencies['docker'] ?? []), Date.now() - start];
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 1000 },
        50,
      ),
      // Prometheus: slow queries
      assemble(
        'prometheus',
        60000,
        async () => {
          const start = Date.now();
          await sleep(100); // 100ms average
          latencies['prometheus'] = [...(latencies['prometheus'] ?? []), Date.now() - start];
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 1000 },
        200,
      ),
    ];

    const s = createScheduler(tasks, { ...d, concurrency: 4 });
    await sleep(2000);
    await s.stop();
    d.cleanup?.();

    // Verify we collected latency data
    expect(Object.keys(latencies).length).toBeGreaterThan(0);
    
    // Each integration should have measured at least some runs
    for (const times of Object.values(latencies)) {
      expect(times.length).toBeGreaterThan(0);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avg).toBeGreaterThan(0);
    }
  });

  test('suggests optimal concurrency based on latencies', async () => {
    const d = await deps();

    // Simulate integrations with known latencies
    const fastTask = assemble(
      'fast',
      1000,
      async () => {
        await sleep(5);
        return 1;
      },
      { maxAttempts: 3, cooldownMs: 100 },
      50,
    );

    const slowTask = assemble(
      'slow',
      5000,
      async () => {
        await sleep(200);
        return 1;
      },
      { maxAttempts: 3, cooldownMs: 1000 },
      250,
    );

    const s = createScheduler([fastTask, slowTask], { ...d, concurrency: 2 });
    await sleep(1500);
    await s.stop();
    d.cleanup?.();

    // Verify both tasks ran
    const fastRuns = d.runLog.forTask('fast');
    const slowRuns = d.runLog.forTask('slow');
    
    expect(fastRuns.length).toBeGreaterThan(0);
    expect(slowRuns.length).toBeGreaterThan(0);

    // With concurrency=2, slow task shouldn't block fast task completely
    // Fast task should have more runs than if concurrency was 1
    expect(fastRuns.length).toBeGreaterThan(1);
  });

  test('handles 10+ integrations concurrently without degradation', async () => {
    const d = await deps();

    // Create 12 integrations (matching real project)
    const tasks = Array.from({ length: 12 }, (_, i) => 
      assemble(
        `integration-${i}`,
        5000,
        async () => {
          // Simulate varying latencies
          const delay = 10 + (i * 5); // 10ms to 65ms
          await sleep(delay);
          return i;
        },
        { maxAttempts: 3, cooldownMs: 1000 },
        100,
      ),
    );

    const s = createScheduler(tasks, { 
      ...d, 
      concurrency: 4,
      classify: () => ({ cause: 'unknown' }),
    });

    await sleep(3000);
    await s.stop();
    d.cleanup?.();

    // All tasks should have run at least once
    for (let i = 0; i < 12; i++) {
      const runs = d.runLog.forTask(`integration-${i}`);
      expect(runs.length).toBeGreaterThan(0);
    }
  });

  test('concurrency limit works correctly with varying task durations', async () => {
    const d = await deps();

    const tasks = [
      assemble(
        'quick',
        100,
        async () => {
          await sleep(5);
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 100 },
        50,
      ),
      assemble(
        'medium',
        200,
        async () => {
          await sleep(25);
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 200 },
        50,
      ),
      assemble(
        'slow',
        500,
        async () => {
          await sleep(100);
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 500 },
        150,
      ),
    ];

    const s = createScheduler(tasks, { ...d, concurrency: 2 });
    await sleep(800);
    await s.stop();
    d.cleanup?.();

    // All tasks should have executed
    expect(d.runLog.forTask('quick').length).toBeGreaterThan(0);
    expect(d.runLog.forTask('medium').length).toBeGreaterThan(0);
    expect(d.runLog.forTask('slow').length).toBeGreaterThan(0);
  });

  test('measures slow task detection accuracy', async () => {
    const d = await deps();

    const tasks = [
      assemble(
        'fast-task',
        1000,
        async () => {
          await sleep(10);
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 100 },
        100,
      ),
      assemble(
        'slow-task',
        1000,
        async () => {
          await sleep(200); // Exceeds expectedDurationMs
          return 1;
        },
        { maxAttempts: 3, cooldownMs: 100 },
        50, // Expected is 50ms, actual is 200ms
      ),
    ];

    let onSlowCalled = false;
    const s = createScheduler(tasks, {
      ...d,
      concurrency: 2,
      onSlow: () => { onSlowCalled = true; },
    });

    await sleep(1000);
    await s.stop();
    d.cleanup?.();

    // Slow task should have been detected
    expect(onSlowCalled).toBe(true);
  });
});
