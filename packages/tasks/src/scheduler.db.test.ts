import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeDatabase } from '@dashboard/db';
import { createRunLogDB, createSnapshotStoreDB } from './index';
import type { RunLog, SnapshotStore } from './index';

const tempPath = `./data/test-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../../packages/db/migrations',
  import.meta.url,
).pathname;

test.afterEach(async () => {
  const fs = await import('node:fs');
  try {
    fs.unlinkSync(tempPath);
  } catch {}
});

async function makeRunLog(): Promise<RunLog<string>> {
  const db = await initializeDatabase({ path: tempPath, migrationsFolder });
  return createRunLogDB(db as never);
}

async function makeStore(): Promise<SnapshotStore> {
  const db = await initializeDatabase({ path: tempPath, migrationsFolder });
  return createSnapshotStoreDB(db as never);
}

test('runLog SQLite persiste runs y los retorna en list()', async () => {
  const runLog = await makeRunLog();

  const runs = [
    {
      taskId: 't1',
      startedAt: new Date('2026-01-01T00:00:00Z'),
      durationMs: 100,
      outcome: 'success' as const,
    },
    {
      taskId: 't1',
      startedAt: new Date('2026-01-01T00:01:00Z'),
      durationMs: 200,
      outcome: 'failure' as const,
      cause: 'timeout',
    },
    {
      taskId: 't2',
      startedAt: new Date('2026-01-01T00:02:00Z'),
      durationMs: 50,
      outcome: 'success' as const,
    },
  ];

  for (const r of runs) {
    runLog.record(r as never);
  }

  // last debe devolver la última corrida de t1
  const lastT1 = runLog.last('t1');
  assert.ok(lastT1 !== undefined, 'last() de t1 debería existir');
  assert.equal(lastT1!.taskId, 't1');
  assert.equal(lastT1!.outcome, 'failure');

  // forTask debe retornar todas las corridas de t1
  const t1Runs = runLog.forTask('t1');
  assert.equal(t1Runs.length, 2);
  assert.ok(t1Runs[0] !== undefined, 'debe haber al menos una corrida');
  assert.equal(t1Runs[0]!.taskId, 't1');

  // list con rango filtra correctamente
  const range = {
    from: new Date('2026-01-01T00:00:30Z'),
    to: new Date('2026-01-01T00:01:30Z'),
  };
  const filtered = runLog.list('t1', range);
  assert.equal(filtered.length, 1);
  assert.ok(
    filtered[0] !== undefined,
    'debe haber al menos un resultado filtrado',
  );
  assert.equal(
    filtered[0]!.startedAt.toISOString(),
    '2026-01-01T00:01:00.000Z',
  );

  // t2 solo tiene una corrida
  assert.equal(runLog.forTask('t2').length, 1);
});

test('snapshotStore SQLite persiste snapshots entre llamadas', async () => {
  const store = await makeStore();
  const key = { taskId: 'media-releases-sonarr' } as never;

  // get sin datos previos devuelve undefined
  assert.equal(store.get(key), undefined);

  // set y get recuperan datos
  store.set(key, { title: 'Breaking Bad S01E01', date: '2026-01-01' });
  const snapshot = store.get(key);
  assert.ok(
    snapshot !== undefined,
    'snapshot debería existir después de set()',
  );
  assert.equal(
    (snapshot!.data as { title: string }).title,
    'Breaking Bad S01E01',
  );

  // overwriting actualiza el snapshot
  store.set(key, { title: 'Breaking Bad S01E02', date: '2026-01-08' });
  const updated = store.get(key);
  assert.ok(updated !== undefined);
  assert.equal(
    (updated!.data as { title: string }).title,
    'Breaking Bad S01E02',
  );

  // otro taskId es independiente
  const otroKey = { taskId: 'calendar-radarr' } as never;
  assert.equal(store.get(otroKey), undefined);
  store.set(otroKey, { events: [] });
  assert.ok(store.get(otroKey) !== undefined);
});
