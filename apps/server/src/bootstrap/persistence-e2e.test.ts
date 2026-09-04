import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { initializeDatabase, insertTaskRun, listTaskRuns } from '@dashboard/db';

const tempPath = `./data/test-persistence-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../../../packages/db/migrations',
  import.meta.url,
).pathname;

test.beforeEach(() => {
  mkdirSync('./data', { recursive: true });
});

test.afterEach(() => {
  try {
    unlinkSync(tempPath);
  } catch {}
});

test('los datos persisten entre instancias de DB', async () => {
  // Primera instancia
  const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });

  insertTaskRun(db1, {
    taskId: 'persist-test',
    startedAt: new Date(),
    durationMs: 500,
    outcome: 'success',
    cause: null,
    detail: { message: 'First instance' },
  });

  const runs1 = listTaskRuns(db1, 'persist-test');
  assert.equal(runs1.length, 1, 'debe haber 1 run en la primera instancia');

  const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });

  const runs2 = listTaskRuns(db2, 'persist-test');
  assert.equal(
    runs2.length,
    1,
    'el run debe persistir en la segunda instancia',
  );
  assert.equal(runs2[0]!.taskId, 'persist-test');
  assert.deepEqual(runs2[0]!.detail, { message: 'First instance' });
});

test('múltiples runs persisten correctamente', async () => {
  const db = await initializeDatabase({ path: tempPath, migrationsFolder });

  for (let i = 0; i < 5; i++) {
    insertTaskRun(db, {
      taskId: `task-${i}`,
      startedAt: new Date(Date.now() - i * 60000),
      durationMs: 100 * (i + 1),
      outcome: i % 2 === 0 ? 'success' : 'failure',
      cause: i % 2 === 0 ? null : 'timeout',
      detail: null,
    });
  }

  const allRuns = listTaskRuns(db, 'task-0');
  assert.equal(allRuns.length, 1);

  for (let i = 0; i < 5; i++) {
    const runs = listTaskRuns(db, `task-${i}`);
    assert.equal(runs.length, 1, `task-${i} debe tener 1 run`);
  }
});
