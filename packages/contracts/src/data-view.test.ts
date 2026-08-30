import test from 'node:test';
import assert from 'node:assert/strict';
import { dataViewOf } from './data-view';

const t = '2026-08-26T10:00:00.000Z';

test('sin intento registrado, el dato nunca se consultó', () => {
  assert.equal(dataViewOf({ data: null, attempt: null }), 'never-queried');
});

test('intento exitoso, el dato está fresco', () => {
  assert.equal(
    dataViewOf({
      data: { obtainedAt: t },
      attempt: { outcome: 'success', at: t },
    }),
    'fresh',
  );
});

test('intento fallido con dato previo, el dato quedó viejo', () => {
  assert.equal(
    dataViewOf({
      data: { obtainedAt: t },
      attempt: { outcome: 'failure', at: t, reason: 'unreachable' },
    }),
    'outdated',
  );
});
