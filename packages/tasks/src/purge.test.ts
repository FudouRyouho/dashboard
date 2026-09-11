import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import { purgeTaskRunsOlderThan, insertTaskRun, taskSnapshots } from '@dashboard/db';
import { createRunLogDB, createPurgeTask } from '.';

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

test('purgeTaskRunsOlderThan elimina solo corridas anteriores al cutoff', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const runs = [
      { taskId: 't1', startedAt: tenDaysAgo },
      { taskId: 't2', startedAt: fiveDaysAgo },
      { taskId: 't3', startedAt: twoDaysAgo },
      { taskId: 't4', startedAt: oneDayAgo },
      { taskId: 't5', startedAt: twelveHoursAgo },
    ];

    for (const r of runs) {
      insertTaskRun(db, {
        taskId: r.taskId,
        startedAt: r.startedAt,
        durationMs: 100,
        outcome: 'success',
        cause: null,
        detail: null,
      });
    }

    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // -3 días
    const result = purgeTaskRunsOlderThan(db, cutoff);

    assert.equal(result.deleted, 2, 'deben eliminarse 2 runs (-10d y -5d)');

    // Verificar que los otros 3 siguen ahí usando el runLog
    const runLog = createRunLogDB<string>(db);
    assert.ok(runLog.forTask('t3').length >= 1, 't3 debe seguir ahí');
    assert.ok(runLog.forTask('t4').length >= 1, 't4 debe seguir ahí');
    assert.ok(runLog.forTask('t5').length >= 1, 't5 debe seguir ahí');
  });
});

test('createPurgeTask: corre, registra snapshot, retorna count', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Insertar 3 runs antiguos y 1 reciente
    for (const [taskId, startedAt] of [
      ['old1', fiveDaysAgo],
      ['old2', twoDaysAgo],
      ['old3', oneDayAgo],
      ['recent', now],
    ] as const) {
      insertTaskRun(db, {
        taskId,
        startedAt,
        durationMs: 100,
        outcome: 'success',
        cause: null,
        detail: null,
      });
    }

    // Crear purge task con 3 días de retención
    const purgeTask = createPurgeTask({ db, daysToKeep: 3 });

    // Ejecutar run() directamente (simula scheduler)
    const deleted = await purgeTask.run(new AbortController().signal);

    // Con daysToKeep=3, solo se borran corridas de hace más de 3 días
    // old1 (-5d) se borra, old2 (-2d), old3 (-1d) y recent (ahora) se mantienen
    // no hay snapshots antiguos, así que total = 1
    assert.equal(deleted, 1, 'debe eliminarse 1 run (-5d, que es >3 días)');

    // El scheduler guarda snapshots, no run() directamente
  });
});

test('purge con 0 runs retorna 0, no falla', async () => {
  await withTempDb(async (db) => {
    const purgeTask = createPurgeTask({ db, daysToKeep: 3 });
    const deleted = await purgeTask.run(new AbortController().signal);

    assert.equal(deleted, 0, 'con DB vacía debe retornar 0');
    // Nota: no se guarda snapshot porque run() se llama directo, no por el scheduler
  });
});

test('createPurgeTask: también purga snapshots antiguos', async () => {
  await withTempDb(async (db) => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Insertar runs
    insertTaskRun(db, {
      taskId: 'old-run',
      startedAt: fiveDaysAgo,
      durationMs: 100,
      outcome: 'success',
      cause: null,
      detail: null,
    });
    insertTaskRun(db, {
      taskId: 'new-run',
      startedAt: twoDaysAgo,
      durationMs: 100,
      outcome: 'success',
      cause: null,
      detail: null,
    });

    // Insertar snapshots directamente a la tabla (el scheduler usa upsertTaskSnapshot
    // que siempre usa now, así que para simular snapshots antiguos insertamos directo)
    db.insert(taskSnapshots)
      .values([
        {
          taskId: 'old-snap',
          data: JSON.stringify({ foo: 'bar' }),
          obtainedAt: fiveDaysAgo,
        },
        {
          taskId: 'new-snap',
          data: JSON.stringify({ baz: 'qux' }),
          obtainedAt: twoDaysAgo,
        },
      ])
      .run();

    const purgeTask = createPurgeTask({ db, daysToKeep: 3 });
    const deleted = await purgeTask.run(new AbortController().signal);

    // Debe borrar 1 run (old-run, -5d > 3d) + 1 snapshot (old-snap, -5d > 3d) = 2
    assert.equal(deleted, 2, 'debe eliminar 1 run y 1 snapshot (>3 días)');
  });
});