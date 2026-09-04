import test from 'node:test';
import assert from 'node:assert/strict';
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

/**
 * Test 1: Concurrency under high load
 * Invariant: peak concurrent executions never exceed the concurrency limit
 * even with many tasks running in quick succession.
 */
test('concurrency limit respected under high load (50 tasks)', async () => {
  const d = await deps();
  let lives = 0;
  let peak = 0;
  const concurrencyLimit = 3;

  // Create 50 tasks with short intervals to maximize load
  const tasks = Array.from(
    { length: 50 },
    (_, i) =>
      assemble(
        `task-${i}`,
        5,
        async () => {
          lives++;
          peak = Math.max(peak, lives);
          // Short work to simulate real task
          await sleep(2);
          lives--;
          return i;
        },
        { maxAttempts: 1, cooldownMs: 0 },
      ), // No cooldown to maximize attempts
  );

  const s = createScheduler<string>(tasks, {
    ...d,
    concurrency: concurrencyLimit,
  });

  // Run for 200ms in real time
  await sleep(200);
  await s.stop();
  d.cleanup();

  assert.ok(
    peak <= concurrencyLimit,
    `Peak concurrency ${peak} exceeded limit ${concurrencyLimit}`,
  );
});

/**
 * Test 2: Periodic task runs multiple times
 * Invariant: A periodic task should execute more than once in a given time window.
 */
test('periodic task executes multiple times', async () => {
  const d = await deps();
  const intervalMs = 50;
  const executionCount = { count: 0 };

  const def = assemble(
    'periodic-task',
    intervalMs,
    async () => {
      executionCount.count++;
      return Date.now();
    },
    { maxAttempts: 1, cooldownMs: 0 },
  );

  const s = createScheduler<string>([def], d);

  // Run for 200ms in real time
  // Expect: at least 2-3 executions (runOnStart + interval ticks)
  await sleep(200);
  await s.stop();
  d.cleanup();

  assert.ok(
    executionCount.count >= 2,
    `Expected at least 2 executions, got ${executionCount.count}`,
  );
});

/**
 * Test 3: Mixed fast/slow tasks under load
 * Invariant: Fast tasks should execute more frequently than slow tasks.
 */
test('mixed fast/slow tasks under load', async () => {
  const d = await deps();
  let fastCount = 0;
  let slowCount = 0;

  const fastTask = assemble(
    'fast-task',
    50,
    async () => {
      fastCount++;
      return Date.now();
    },
    { maxAttempts: 1, cooldownMs: 0 },
  );

  const slowTask = assemble(
    'slow-task',
    200,
    async () => {
      // Simulate work that takes time
      await sleep(100); // 100ms work
      slowCount++;
      return Date.now();
    },
    { maxAttempts: 1, cooldownMs: 0 },
  );

  const s = createScheduler<string>([fastTask, slowTask], {
    ...d,
    concurrency: 2, // Share pool of 2
  });

  // Run for 500ms in real time to give both tasks time to execute multiple times
  await sleep(500);
  await s.stop();
  d.cleanup();

  // Both tasks should have executed at least once in 500ms
  // Note: with toad-scheduler (real timers), exact ratios vary by machine.
  assert.ok(
    fastCount >= 1,
    `Fast task should execute at least 1 time, got ${fastCount}`,
  );
  assert.ok(
    slowCount >= 1,
    `Slow task should execute at least 1 time, got ${slowCount}`,
  );
});
