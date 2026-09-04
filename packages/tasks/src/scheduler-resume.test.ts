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
// Minimal clock for deterministic timestamp control in resume tests
class FakeClock {
  private current: number;
  constructor(start: number | Date = 0) {
    this.current = typeof start === 'number' ? start : start.getTime();
  }
  now = (): Date => new Date(this.current);
  advance(ms: number): void {
    this.current += ms;
  }
}

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

const depsWithClock = async (clock: FakeClock) => {
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
    now: clock.now,
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
 * Test 6: Scheduler resume after clean stop/start
 * Invariant: After stopping and restarting the scheduler,
 * new executions are recorded correctly without losing prior state.
 */
test('scheduler resumes correctly after clean stop/start', async () => {
  const clock = new FakeClock(0); // Start at time 0
  const tempPath = `./data/test-scheduler-resume-${randomUUID()}.sqlite`;
  const migrationsFolder = new URL(
    '../../../packages/db/migrations',
    import.meta.url,
  ).pathname;

  // First scheduler instance
  const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });
  const store1 = createSnapshotStoreDB(db1);
  const runLog1 = createRunLogDB<string>(db1);
  const s1 = createScheduler<string>(
    [
      assemble(
        'resume-task',
        50,
        async () => {
          return Date.now();
        },
        { maxAttempts: 1, cooldownMs: 0 },
      ),
    ],
    {
      store: store1,
      runLog: runLog1,
      classify: () => ({ cause: 'unreachable' as const }),
      now: clock.now,
      concurrency: 2,
      drainMs: 0,
    },
  );

  // Run first scheduler: execute at 0ms (runOnStart), then at 50ms, 100ms
  // Advance to 50ms to allow first interval
  clock.advance(50);
  await sleep(50); // Wait for task to complete
  // Advance to 100ms to allow second interval
  clock.advance(50);
  await sleep(50); // Wait for task to complete
  // Advance to 150ms to allow third interval
  clock.advance(50);
  await sleep(50); // Wait for task to complete
  await s1.stop();

  // Verify first run recorded executions
  let executions1 = runLog1
    .forTask('resume-task')
    .map((r) => r.startedAt.getTime());
  assert.ok(
    executions1.length >= 2,
    `First scheduler should have recorded at least 2 executions, got ${executions1.length}`,
  );

  // Create second scheduler instance with same DB
  const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });
  const store2 = createSnapshotStoreDB(db2);
  const runLog2 = createRunLogDB<string>(db2);
  const s2 = createScheduler<string>(
    [
      assemble(
        'resume-task',
        50,
        async () => {
          return Date.now();
        },
        { maxAttempts: 1, cooldownMs: 0 },
      ),
    ],
    {
      store: store2,
      runLog: runLog2,
      classify: () => ({ cause: 'unreachable' as const }),
      now: clock.now,
      concurrency: 2,
      drainMs: 0,
    },
  );

  // Advance clock another 150ms in steps (now at 300ms total)
  for (let i = 0; i < 3; i++) {
    clock.advance(50);
    await sleep(50);
  }
  await s2.stop();

  // Verify second scheduler saw executions from both periods
  const executions2 = runLog2
    .forTask('resume-task')
    .map((r) => r.startedAt.getTime());

  // Should have executions from first period (0, 50, 100) AND second period (150, 200, 250)
  // Expect at least 4 distinct executions (could be more due to runOnStart behavior)
  assert.ok(
    executions2.length >= 4,
    `Second scheduler should have recorded executions from both periods, got ${executions2.length}`,
  );

  // Verify snapshot store also persisted correctly
  const snapshot1 = store1.get({ taskId: 'resume-task' });
  const snapshot2 = store2.get({ taskId: 'resume-task' });

  assert.ok(
    snapshot1 !== undefined && snapshot2 !== undefined,
    'Both schedulers should have snapshots',
  );
  // The second snapshot should be newer (later timestamp)
  assert.ok(
    snapshot2.obtainedAt.getTime() >= snapshot1.obtainedAt.getTime(),
    'Second snapshot should be newer or equal to first',
  );

  // Cleanup
  try {
    unlinkSync(tempPath);
  } catch {}
});
