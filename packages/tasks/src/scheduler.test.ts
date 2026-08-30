import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMemoryStore,
  createRunLog,
  createScheduler,
  type SnapshotKey,
  type TaskDefinition,
} from '.';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (taskId: string): SnapshotKey<number> => ({ taskId });

const armar = <T>(
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

const deps = () => ({
  store: createMemoryStore(),
  runLog: createRunLog<string>(50),
  classify: () => ({ cause: 'unreachable' as const }),
  now: () => new Date(),
  concurrency: 4,
  drainMs: 300,
});

test('una tarea no corre dos veces a la vez', async () => {
  let vivas = 0;
  let pico = 0;
  const def = armar('a', 30, async () => {
    vivas++;
    pico = Math.max(pico, vivas);
    await sleep(120);
    vivas--;
    return 1;
  });
  const s = createScheduler<string>([def], deps());
  await sleep(400);
  await s.stop();
  assert.equal(pico, 1, `hubo ${pico} corridas simultáneas de la misma tarea`);
});

test('sólo el éxito escribe el almacén', async () => {
  const d = deps();
  let n = 0;
  const def = armar('b', 40, async () => {
    n++;
    if (n > 1) throw new Error('boom');
    return 42;
  });
  const s = createScheduler<string>([def], d);
  await sleep(200);
  await s.stop();
  const snapshot = d.store.get(key('b'));
  assert.equal(snapshot?.data, 42, 'el dato del primer éxito sigue intacto');
  assert.ok(
    d.runLog.forTask('b').some((r) => r.outcome === 'failure'),
    'y los fallos quedaron registrados',
  );
});

test('stop() cancela la corrida en vuelo y la marca aborted, no failure', async () => {
  const d = deps();
  const def = armar('c', 1000, async (signal) => {
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
  await s.stop();
  assert.equal(d.runLog.last('c')?.outcome, 'aborted');
  assert.equal(
    d.store.get(key('c')),
    undefined,
    'una corrida abortada no escribe',
  );
});

test('el límite de concurrencia acota las corridas en vuelo', async () => {
  let vivas = 0;
  let pico = 0;
  const tareas = Array.from({ length: 10 }, (_, i) =>
    armar(`t${i}`, 200, async () => {
      vivas++;
      pico = Math.max(pico, vivas);
      await sleep(80);
      vivas--;
      return i;
    }),
  );
  const s = createScheduler<string>(tareas, { ...deps(), concurrency: 3 });
  await sleep(250);
  await s.stop();
  assert.ok(pico <= 3, `el pico global fue ${pico}, con un techo de 3`);
});

test('tras maxAttempts fallos seguidos, la tarea espera el cooldown', async () => {
  let intentos = 0;
  const def = armar(
    'd',
    30,
    async () => {
      intentos++;
      throw new Error('boom');
    },
    { maxAttempts: 3, cooldownMs: 300 },
  );
  const s = createScheduler<string>([def], deps());
  await sleep(200);
  const durante = intentos;
  await sleep(300);
  await s.stop();
  assert.equal(durante, 3, `se frenó a los 3 intentos (fueron ${durante})`);
  assert.ok(intentos > 3, 'y reintentó después del cooldown');
});

test('un éxito borra el contador de fallos', async () => {
  const d = deps();
  let n = 0;
  const def = armar(
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
  await sleep(200);
  await s.stop();
  const outcomes = d.runLog.forTask('e').map((r) => r.outcome);
  assert.equal(outcomes[0], 'failure');
  assert.ok(
    outcomes.filter((o) => o === 'success').length >= 3,
    `siguió corriendo tras el fallo: ${outcomes.join(', ')}`,
  );
});
