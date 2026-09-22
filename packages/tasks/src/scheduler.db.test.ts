import { test, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { initializeDatabase } from '@dashboard/db';
import { createRunLogDB, createSnapshotStoreDB } from './index';
import type { RunLog, SnapshotStore } from './index';

const tempPath = `./data/test-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../../packages/db/migrations',
  import.meta.url,
).pathname;

afterEach(async () => {
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
  expect(lastT1 !== undefined, 'last().toBeTruthy() de t1 debería existir');
  expect(lastT1!.taskId).toBe('t1');
  expect(lastT1!.outcome).toBe('failure');

  // forTask debe retornar todas las corridas de t1
  const t1Runs = runLog.forTask('t1');
  expect(t1Runs.length).toBe(2);
  expect(t1Runs[0] !== undefined, 'debe haber al menos una corrida').toBeTruthy();
  expect(t1Runs[0]!.taskId).toBe('t1');

  // list con rango filtra correctamente
  const range = {
    from: new Date('2026-01-01T00:00:30Z'),
    to: new Date('2026-01-01T00:01:30Z'),
  };
  const filtered = runLog.list('t1', range);
  expect(filtered.length).toBe(1);
  expect(
    filtered[0] !== undefined,
    'debe haber al menos un resultado filtrado',
  ).toBeTruthy();
  expect(
    filtered[0]!.startedAt.toISOString()).toBe('2026-01-01T00:01:00.000Z',
  );

  // t2 solo tiene una corrida
  expect(runLog.forTask('t2').length).toBe(1);
});

test('snapshotStore SQLite persiste snapshots entre llamadas', async () => {
  const store = await makeStore();
  const key = { taskId: 'media-releases-sonarr' } as never;

  // get sin datos previos devuelve undefined
  expect(store.get(key)).toBe(undefined);

  // set y get recuperan datos
  store.set(key, { title: 'Breaking Bad S01E01', date: '2026-01-01' });
  const snapshot = store.get(key);
  expect(
    snapshot !== undefined,
    'snapshot debería existir después de set().toBeTruthy()',
  );
  expect(
    (snapshot!.data as { title: string }).title).toBe('Breaking Bad S01E01',
  );

  // overwriting actualiza el snapshot
  store.set(key, { title: 'Breaking Bad S01E02', date: '2026-01-08' });
  const updated = store.get(key);
  expect(updated !== undefined).toBeTruthy();
  expect(
    (updated!.data as { title: string }).title).toBe('Breaking Bad S01E02',
  );

  // otro taskId es independiente
  const otroKey = { taskId: 'calendar-radarr' } as never;
  expect(store.get(otroKey)).toBe(undefined);
  store.set(otroKey, { events: [] });
  expect(store.get(otroKey) !== undefined);
});
