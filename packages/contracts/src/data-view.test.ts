import { test, expect, describe } from 'vitest';
import { dataViewOf } from './data-view';

const t = '2026-08-26T10:00:00.000Z';

describe('dataViewOf', () => {
  test('no attempt registered, data never queried', () => {
    expect(dataViewOf({ data: null, attempt: null })).toBe('never-queried');
  });

  test('successful attempt, data is fresh', () => {
    expect(
      dataViewOf({
        data: { obtainedAt: t },
        attempt: { outcome: 'success', at: t },
      })
    ).toBe('fresh');
  });

  test('failed attempt with prior data, data became outdated', () => {
    expect(
      dataViewOf({
        data: { obtainedAt: t },
        attempt: { outcome: 'failure', at: t, reason: 'unreachable' },
      })
    ).toBe('outdated');
  });

  test('failed attempt with no prior data, data is missing', () => {
    expect(
      dataViewOf({
        data: null,
        attempt: { outcome: 'failure', at: t, reason: 'unreachable' },
      })
    ).toBe('missing');
  });
});