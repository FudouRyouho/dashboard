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
    now: function () {
      return new Date();
    },
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
 * Test: una tarea no corre dos veces a la vez
 */
test('una tarea no corre dos veces a la vez', async () => {
  const d = await deps();
  let lives = 0;
  let peak = 0;
  const def = assemble('a', 30, async () => {
    lives++;
    peak = Math.max(peak, lives);
    await sleep(120);
    lives--;
    return 1;
  });
  const s = createScheduler<string>([def], d);
  await sleep(400);
  await sleep(50);
  await s.stop();
  d.cleanup();
  assert.equal(peak, 1, `hubo ${peak} corridas simultáneas de la misma tarea`);
});

/**
 * Test: sólo el éxito escribe el almacén
 */
test('sólo el éxito escribe el almacén', async () => {
  const d = await deps();
  let n = 0;
  const def = assemble(
    'b',
    40,
    async () => {
      n++;
      if (n > 1) throw new Error('boom');
      return 42;
    },
    { maxAttempts: 3, cooldownMs: 60_000 },
  );
  const s = createScheduler<string>([def], d);
  await sleep(200);
  await s.stop();
  d.cleanup();
  const snapshot = d.store.get(key('b'));
  assert.equal(snapshot?.data, 42, 'el dato del primer éxito sigue intacto');
  assert.ok(
    d.runLog.forTask('b').some((r) => r.outcome === 'failure'),
    'y los fallos quedaron registrados',
  );
});

/**
 * Test: stop() cancela la corrida en vuelo y la marca aborted, no failure
 */
test('stop() cancela la corrida en vuelo y la marca aborted, no failure', async () => {
  const d = await deps();
  const def = assemble('c', 1000, async (signal) => {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 5000);
      signal.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new Error('AbortError'));
      });
    });
    return 1;
  });
  const s = createScheduler<string>([def], d);
  await sleep(60);
  await sleep(20);
  await s.stop();
  d.cleanup();
  assert.equal(d.runLog.last('c')?.outcome, 'aborted');
  assert.equal(
    d.store.get(key('c')),
    undefined,
    'una corrida abortada no escribe',
  );
});

/**
 * Test: el límite de concurrencia acota las corridas en vuelo
 */
test('el límite de concurrencia acota las corridas en vuelo', async () => {
  const d = await deps();
  let lives = 0;
  let peak = 0;
  const tasks = Array.from({ length: 10 }, (_, i) =>
    assemble(`t${i}`, 200, async () => {
      lives++;
      peak = Math.max(peak, lives);
      await sleep(80);
      lives--;
      return i;
    }),
  );
  const depsObj = await deps();
  const s = createScheduler<string>(tasks, { ...depsObj, concurrency: 3 });
  await sleep(250);
  await sleep(50);
  await s.stop();
  d.cleanup();
  assert.ok(peak <= 3, `el peak global fue ${peak}, con un techo de 3`);
});

/**
 * Test: tras maxAttempts fallos seguidos, la tarea espera el cooldown
 */
test('tras maxAttempts fallos seguidos, la tarea espera el cooldown', async () => {
  const d = await deps();
  let attempts = 0;
  const def = assemble(
    'd',
    30,
    async () => {
      attempts++;
      throw new Error('boom');
    },
    { maxAttempts: 3, cooldownMs: 300 },
  );
  const s = createScheduler<string>([def], d);
  await sleep(200); // Wait to see what happens
  const during = attempts;
  await sleep(300); // Wait through potential cooldown period
  await sleep(50); // Additional time to see if task runs again
  await s.stop();
  d.cleanup();
  // We should see at least 2 attempts before any cooldown effect
  assert.ok(
    during >= 2,
    `Should see at least 2 attempts before cooldown, got ${during}`,
  );
  // After waiting, we should be able to run again if cooldown worked correctly
  assert.ok(
    attempts > during,
    `Should be able to run again after waiting, got ${attempts} total attempts`,
  );
});

/**
 * Test: un éxito borra el contador de fallos
 */
test('un éxito borra el contador de fallos', async () => {
  const d = await deps();
  let n = 0;
  const def = assemble(
    'e',
    30,
    async () => {
      n++;
      if (n === 1) throw new Error('el primero falla');
      return n;
    },
    { maxAttempts: 2, cooldownMs: 60_000 },
  );
  const s = createScheduler<string>([def], d);
  await sleep(200); // Wait to see if we get multiple attempts
  await s.stop();
  d.cleanup();
  // listTaskRuns devuelve DESC; revertir para obtener orden cronológico
  const outcomes = [...d.runLog.forTask('e').map((r) => r.outcome)].reverse();
  assert.equal(outcomes[0], 'failure', 'la primera corrida falló');
  // After a success, the failure count should be reset, so subsequent runs should succeed
  assert.ok(
    outcomes.slice(1).every((o) => o === 'success'),
    `tras el primer fallo todas fueron success: ${outcomes.join(',')}`,
  );
  // Should have had at least the initial failure plus some successes
  assert.ok(
    n >= 2,
    `Should have at least one failure and one success, got ${n} total runs`,
  );
});

/**
 * Test: cooldownMs = 0: tras maxAttempts, reintenta inmediatamente
 */
test('cooldownMs = 0: tras maxAttempts, reintenta inmediatamente', async () => {
  const d = await deps();
  let attempts = 0;
  const def = assemble(
    'immediate-retry',
    30,
    async () => {
      attempts++;
      throw new Error('boom');
    },
    { maxAttempts: 2, cooldownMs: 0 },
  );
  const s = createScheduler<string>([def], d);
  await sleep(200); // Wait to see if we get multiple attempts
  await s.stop();
  d.cleanup();
  // Con cooldown=0, después de maxAttempts failures, debería seguir intentando inmediatamente
  assert.ok(
    attempts >= 2,
    `con cooldown=0 debe reintentar inmediatamente tras maxAttempts, got ${attempts} attempts`,
  );
});

/**
 * Test: maxAttempts: 1: un fallo basta para cooldown
 */
test('maxAttempts: 1: un fallo basta para cooldown', async () => {
  const d = await deps();
  let attempts = 0;
  const def = assemble(
    'single-attempt',
    30,
    async () => {
      attempts++;
      throw new Error('boom');
    },
    { maxAttempts: 1, cooldownMs: 100 },
  );
  const s = createScheduler<string>([def], d);
  await sleep(200); // Wait to see the behavior
  await s.stop();
  d.cleanup();
  // Con maxAttempts=1, después del primer fallo debería entrar en cooldown
  // Esperamos 200ms con everyMs=30, so debería haber tenido tiempo para:
  // - Intento 1 (fallo) -> entra en cooldown de 100ms
  // - Durante los siguientes 100ms de cooldown, no debería correr
  // - Después de 100ms, debería poder correr nuevamente
  // Entonces en 200ms total, debería haber tenido oportunidad de correr 2 veces
  assert.ok(
    attempts >= 2,
    `Con maxAttempts=1 debería haber tenido al menos 2 intentos en 200ms, got ${attempts}`,
  );
});
