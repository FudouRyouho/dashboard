import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import {
  initializeDatabase,
  insertTaskRun,
  listTaskRuns,
  type InsertTaskRunInput,
} from '@dashboard/db';

mkdirSync('./data', { recursive: true });

const tempPath = `./data/test-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../../../packages/db/migrations',
  import.meta.url,
).pathname;

test.afterEach(() => {
  try {
    unlinkSync(tempPath);
  } catch {}
});

test('initializeDatabase crea conexión y corre migraciones', async () => {
  assert.equal(
    existsSync(tempPath),
    false,
    'archivo temporal no debe existir antes',
  );

  const db = await initializeDatabase({ path: tempPath, migrationsFolder });
  assert.ok(db, 'debe retornar una instancia de DB');
});

test('initializeDatabase es idempotente (corre dos veces sin error)', async () => {
  const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });
  assert.ok(db1);

  const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });
  assert.ok(db2);
});

test('la DB persiste datos entre llamadas a initializeDatabase', async () => {
  const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });

  const input: InsertTaskRunInput = {
    taskId: 'test',
    startedAt: new Date(),
    durationMs: 100,
    outcome: 'success',
    cause: null,
    detail: null,
  };
  insertTaskRun(db1, input);

  const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });

  const runs = listTaskRuns(db2, 'test');
  assert.equal(runs.length, 1, 'debe haber 1 fila después de reabrir la DB');
  assert.ok(runs[0] !== undefined, 'la primera corrida no debe ser undefined');
  assert.equal(runs[0]!.taskId, 'test');
});
