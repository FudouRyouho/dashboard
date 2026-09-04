import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import {
  initializeDatabase,
  purgeTaskRunsOlderThan,
  insertTaskRun,
} from '@dashboard/db';
import { createPurgeTask, createSnapshotStoreDB, createRunLogDB } from '.';
import type { TaskDefinition } from './types';

const tempPath = () => `./data/test-purge-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../../packages/db/migrations',
  import.meta.url,
).pathname;

async function withTempDb<T>(
  fn: (db: Awaited<ReturnType<typeof initializeDatabase>>) => Promise<T>,
): Promise<T> {
  const path = tempPath();
  const db = await initializeDatabase({ path, migrationsFolder });
  try {
    return await fn(db);
  } finally {
    try {
      unlinkSync(path);
    } catch {}
  }
}

/**
 * Test 4: Purge deletes exactly rows before cutoff
 * Invariant: Number of deleted rows equals count of rows with startedAt <= cutoff
 */
test('purge deletes exactly rows before cutoff', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Insert rows at different times: some before cutoff, some after
    const testTimes = [
      oneWeekAgo, // 7 days ago -> should be deleted
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago -> deleted
      new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago -> deleted
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // exactly cutoff -> deleted (lte)
      new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago -> kept
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago -> kept
      now, // now -> kept
    ];

    // Insert one row per time
    for (const startedAt of testTimes) {
      insertTaskRun(db, {
        taskId: 'purge-test',
        startedAt,
        durationMs: 100,
        outcome: 'success',
        cause: null,
        detail: null,
      });
    }

    const result = purgeTaskRunsOlderThan(db, cutoff);

    // Expect: 4 rows deleted (indices 0,1,2,3)
    assert.equal(
      result.deleted,
      4,
      `Expected 4 rows deleted, got ${result.deleted}`,
    );

    // Verify remaining rows using runLog
    const runLog = createRunLogDB<string>(db);
    assert.ok(
      runLog.forTask('purge-test').length >= 3,
      'should have at least 3 remaining rows',
    );
  });
});

/**
 * Test 5: Purge with extreme dates (very old data)
 * Invariant:
 *   - If all rows are recent, purge with a cutoff before them deletes 0
 *   - If all rows are old, purge with a cutoff after them deletes all
 */
test('purge handles extreme dates correctly', async () => {
  const now = new Date();

  // Case A: All rows recent (within last second)
  await withTempDb(async (db) => {
    const recentTimes = Array.from(
      { length: 100 },
      (_, i) => new Date(now.getTime() - i * 10), // Last 100 * 10ms = ~1 second
    );

    for (const startedAt of recentTimes) {
      insertTaskRun(db, {
        taskId: 'recent-test',
        startedAt,
        durationMs: 100,
        outcome: 'success',
        cause: null,
        detail: null,
      });
    }

    // Cutoff in the past (before all recent data) -> nothing deleted
    const pastCutoff = new Date(now.getTime() - 2000); // 2 seconds ago
    const recentResult = purgeTaskRunsOlderThan(db, pastCutoff);
    assert.equal(
      recentResult.deleted,
      0,
      `Expected 0 deleted for recent data, got ${recentResult.deleted}`,
    );
  });

  // Case B: All rows old (31 to 60 days ago)
  await withTempDb(async (db) => {
    const oldEnd = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago (most recent)
    const oldTimes = Array.from(
      { length: 100 },
      (_, i) => new Date(oldEnd.getTime() - i * 24 * 60 * 60 * 1000), // 31 to 130 days ago
    );

    for (const startedAt of oldTimes) {
      insertTaskRun(db, {
        taskId: 'old-test',
        startedAt,
        durationMs: 100,
        outcome: 'success',
        cause: null,
        detail: null,
      });
    }

    // Cutoff at 30 days ago -> all 100 old rows (31-60 days) are deleted
    const oldResult = purgeTaskRunsOlderThan(
      db,
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    );
    assert.equal(
      oldResult.deleted,
      100,
      `Expected 100 deleted for old data, got ${oldResult.deleted}`,
    );
  });
});
