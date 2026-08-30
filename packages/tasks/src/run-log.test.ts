import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunLog } from '.';

const run = (taskId: string, n: number) => ({
  taskId,
  startedAt: new Date(`2026-08-26T10:00:${n.toString().padStart(2, '0')}.000Z`),
  durationMs: 10,
  outcome: 'success' as const,
});

test('no crece más allá de capacity: la corrida más vieja se cae', () => {
  const log = createRunLog<string>(2);
  log.record(run('a', 0));
  log.record(run('a', 1));
  log.record(run('a', 2));
  assert.equal(log.forTask('a').length, 2);
  const runItem = log.forTask('a')[0];
  assert.ok(runItem);
  assert.equal(runItem.startedAt.getSeconds(), 1);
});

test('last devuelve la corrida más reciente para el taskId', () => {
  const log = createRunLog<string>(10);
  log.record(run('a', 0));
  log.record(run('a', 1));
  log.record(run('a', 2));
  assert.equal(log.last('a')?.startedAt.getSeconds(), 2);
});

test('aislamiento: last no devuelve corridas de otra tarea', () => {
  const log = createRunLog<string>(10);
  log.record(run('a', 0));
  log.record(run('b', 1));
  assert.equal(log.last('a')?.startedAt.getSeconds(), 0);
  assert.equal(log.last('b')?.startedAt.getSeconds(), 1);
});

test('una tarea frecuente no borra la historia de una lenta', () => {
  const log = createRunLog<string>(60);
  log.record(run('sonarr:calendar', 0));
  for (let i = 1; i <= 60; i++) log.record(run('sonarr:queue', i % 60));
  assert.ok(
    log.last('sonarr:calendar'),
    'la corrida de calendario sigue estando',
  );
  assert.equal(log.forTask('sonarr:queue').length, 60);
});

test('forTask devuelve una copia: mutarla no toca el anillo', () => {
  const log = createRunLog<string>(10);
  log.record(run('a', 0));
  log.forTask('a').push(run('a', 1));
  assert.equal(log.forTask('a').length, 1);
});
