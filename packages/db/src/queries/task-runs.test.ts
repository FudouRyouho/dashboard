import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  insertTaskRun,
  listTaskRuns,
  lastTaskRun,
  purgeTaskRunsOlderThan,
} from './task-runs.js';

const tempPath = () => `./data/test-task-runs-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../migrations',
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

test('insertTaskRun inserts a new run', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-1';
    const now = new Date();
    
    insertTaskRun(db, {
      taskId,
      startedAt: now,
      durationMs: 1000,
      outcome: 'success',
      cause: null,
      detail: null,
    });
    
    const runs = listTaskRuns(db, taskId);
    assert.equal(runs.length, 1, 'Debe haber 1 corrida');
    assert.equal(runs[0]!.taskId, taskId);
    assert.equal(runs[0]!.durationMs, 1000);
    assert.equal(runs[0]!.outcome, 'success');
  });
});

test('insertTaskRun serializes detail to JSON', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-2';
    const now = new Date();
    const detail = { error: 'something went wrong', code: 500 };
    
    insertTaskRun(db, {
      taskId,
      startedAt: now,
      durationMs: 500,
      outcome: 'failure',
      cause: 'timeout',
      detail,
    });
    
    const runs = listTaskRuns(db, taskId);
    assert.deepEqual(runs[0]!.detail, detail);
    assert.equal(runs[0]!.cause, 'timeout');
  });
});

test('listTaskRuns returns runs ordered by startedAt desc', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-3';
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);
    const latest = new Date(now.getTime() - 10000);
    
    insertTaskRun(db, { taskId, startedAt: earlier, durationMs: 100, outcome: 'success' });
    await new Promise((r) => setTimeout(r, 10));
    insertTaskRun(db, { taskId, startedAt: now, durationMs: 200, outcome: 'failure' });
    insertTaskRun(db, { taskId, startedAt: latest, durationMs: 150, outcome: 'aborted' });
    
    const runs = listTaskRuns(db, taskId);
    assert.equal(runs.length, 3, 'Debe haber 3 corridas');
    assert.equal(runs[0]!.startedAt.getTime(), now.getTime(), 'Primera debe ser la más reciente');
    assert.equal(runs[1]!.startedAt.getTime(), latest.getTime(), 'Segunda debe ser la siguiente');
    assert.equal(runs[2]!.startedAt.getTime(), earlier.getTime(), 'Tercera debe ser la más antigua');
  });
});

test('listTaskRuns filters by range', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-4';
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    insertTaskRun(db, { taskId, startedAt: twoDaysAgo, durationMs: 100, outcome: 'success' });
    insertTaskRun(db, { taskId, startedAt: yesterday, durationMs: 200, outcome: 'failure' });
    insertTaskRun(db, { taskId, startedAt: now, durationMs: 300, outcome: 'success' });
    
    const range = { from: yesterday, to: now };
    const runs = listTaskRuns(db, taskId, range);
    
    assert.equal(runs.length, 2, 'Debe filtrar solo las corridas en el rango');
  });
});

test('lastTaskRun returns the most recent run', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-5';
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);
    
    insertTaskRun(db, { taskId, startedAt: earlier, durationMs: 100, outcome: 'success' });
    await new Promise((r) => setTimeout(r, 10));
    insertTaskRun(db, { taskId, startedAt: now, durationMs: 200, outcome: 'failure' });
    
    const last = lastTaskRun(db, taskId);
    assert.ok(last, 'Debe haber una última corrida');
    assert.equal(last!.durationMs, 200, 'Debe ser la más reciente');
    assert.equal(last!.outcome, 'failure');
  });
});

test('lastTaskRun returns undefined when no runs exist', async () => {
  await withTempDb(async (db) => {
    const last = lastTaskRun(db, 'non-existent');
    assert.equal(last, undefined, 'Debe ser undefined cuando no hay corridas');
  });
});

test('purgeTaskRunsOlderThan removes old runs', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-6';
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    
    insertTaskRun(db, { taskId, startedAt: fiveDaysAgo, durationMs: 100, outcome: 'success' });
    insertTaskRun(db, { taskId, startedAt: oneDayAgo, durationMs: 200, outcome: 'failure' });
    
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = purgeTaskRunsOlderThan(db, cutoff);
    
    assert.equal(result.deleted, 1, 'Debe eliminar 1 corrida antigua');
    
    const remaining = listTaskRuns(db, taskId);
    assert.equal(remaining.length, 1, 'Debe quedar 1 corrida');
    assert.equal(remaining[0]!.startedAt.getTime(), oneDayAgo.getTime());
  });
});

test('purgeTaskRunsOlderThan returns 0 when no old runs', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-7';
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    insertTaskRun(db, { taskId, startedAt: oneHourAgo, durationMs: 100, outcome: 'success' });
    
    const cutoff = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const result = purgeTaskRunsOlderThan(db, cutoff);
    
    assert.equal(result.deleted, 0, 'No debe eliminar nada');
  });
});

test('purgeTaskRunsOlderThan is safe on empty table', async () => {
  await withTempDb(async (db) => {
    const result = purgeTaskRunsOlderThan(db, new Date());
    assert.equal(result.deleted, 0, 'Debe retornar 0 en tabla vacía');
  });
});

test('different taskIds have isolated runs', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    
    insertTaskRun(db, { taskId: 'task-a', startedAt: now, durationMs: 100, outcome: 'success' });
    insertTaskRun(db, { taskId: 'task-b', startedAt: now, durationMs: 200, outcome: 'failure' });
    
    const runsA = listTaskRuns(db, 'task-a');
    const runsB = listTaskRuns(db, 'task-b');
    
    assert.equal(runsA.length, 1, 'task-a debe tener 1 corrida');
    assert.equal(runsB.length, 1, 'task-b debe tener 1 corrida');
    assert.equal(runsA[0]!.durationMs, 100);
    assert.equal(runsB[0]!.durationMs, 200);
  });
});
