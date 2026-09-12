import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  getTaskSnapshot,
  upsertTaskSnapshot,
  purgeTaskSnapshotsOlderThan,
} from './task-snapshots.js';
import { taskSnapshots } from '../schemas/tasks';

const tempPath = () => `./data/test-task-snapshots-${randomUUID()}.sqlite`;
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

test('getTaskSnapshot returns undefined when no snapshot exists', async () => {
  await withTempDb(async (db) => {
    const result = getTaskSnapshot(db, 'non-existent');
    assert.equal(result, undefined, 'Debe retornar undefined cuando no existe snapshot');
  });
});

test('upsertTaskSnapshot creates new snapshot', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-1';
    const data = { events: [{ title: 'Test Event' }], count: 5 };
    
    upsertTaskSnapshot(db, taskId, data);
    
    const snapshot = getTaskSnapshot(db, taskId);
    assert.ok(snapshot, 'Debe existir el snapshot');
    assert.deepEqual(snapshot!.data, data, 'Los datos deben coincidir');
  });
});

test('upsertTaskSnapshot updates existing snapshot', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-2';
    const initialData = { events: [], count: 0 };
    const updatedData = { events: [{ title: 'New Event' }], count: 10 };
    
    upsertTaskSnapshot(db, taskId, initialData);
    await new Promise((r) => setTimeout(r, 10));
    upsertTaskSnapshot(db, taskId, updatedData);
    
    const snapshot = getTaskSnapshot(db, taskId);
    assert.ok(snapshot, 'Debe existir el snapshot actualizado');
    assert.deepEqual(snapshot!.data, updatedData, 'Los datos deben estar actualizados');
  });
});

test('upsertTaskSnapshot preserves data across upserts', async () => {
  await withTempDb(async (db) => {
    const taskId = 'task-3';
    const nestedData = {
      metadata: { source: 'sonarr', version: 2 },
      items: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }],
    };
    
    upsertTaskSnapshot(db, taskId, nestedData);
    
    const snapshot = getTaskSnapshot(db, taskId);
    assert.ok(snapshot);
    assert.equal((snapshot!.data as { metadata: { source: string } }).metadata.source, 'sonarr');
    assert.equal((snapshot!.data as { items: Array<unknown> }).items.length, 2);
  });
});

test('different taskIds have independent snapshots', async () => {
  await withTempDb(async (db) => {
    const taskId1 = 'task-a';
    const taskId2 = 'task-b';
    
    upsertTaskSnapshot(db, taskId1, { value: 1 });
    upsertTaskSnapshot(db, taskId2, { value: 2 });
    
    const snap1 = getTaskSnapshot(db, taskId1);
    const snap2 = getTaskSnapshot(db, taskId2);
    
    assert.ok(snap1);
    assert.ok(snap2);
    assert.equal((snap1!.data as { value: number }).value, 1);
    assert.equal((snap2!.data as { value: number }).value, 2);
  });
});

test('purgeTaskSnapshotsOlderThan removes old snapshots', async () => {
  await withTempDb(async (db) => {
    const taskId1 = 'old-task';
    const taskId2 = 'new-task';
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    
    // Insertar snapshots manualmente con timestamps antiguos
    db.insert(taskSnapshots).values({
      taskId: taskId1,
      data: JSON.stringify({ value: 'old' }),
      obtainedAt: fiveDaysAgo,
    }).run();

    db.insert(taskSnapshots).values({
      taskId: taskId2,
      data: JSON.stringify({ value: 'new' }),
      obtainedAt: oneDayAgo,
    }).run();
    
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = purgeTaskSnapshotsOlderThan(db, cutoff);
    
    assert.equal(result.deleted, 1, 'Debe eliminar 1 snapshot antiguo');
    
    const remaining = getTaskSnapshot(db, taskId2);
    assert.ok(remaining, 'El snapshot nuevo debe seguir existiendo');
  });
});

test('purgeTaskSnapshotsOlderThan returns 0 when no old snapshots', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    db.insert(taskSnapshots).values({
      taskId: 'recent',
      data: JSON.stringify({ value: 'recent' }),
      obtainedAt: oneHourAgo,
    }).run();
    
    const cutoff = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const result = purgeTaskSnapshotsOlderThan(db, cutoff);
    
    assert.equal(result.deleted, 0, 'No debe eliminar nada reciente');
  });
});

test('purgeTaskSnapshotsOlderThan is safe on empty table', async () => {
  await withTempDb(async (db) => {
    const result = purgeTaskSnapshotsOlderThan(db, new Date());
    assert.equal(result.deleted, 0, 'Debe retornar 0 en tabla vacía');
  });
});
