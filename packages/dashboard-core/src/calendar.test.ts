import { describe, test, expect } from 'vitest';
import {
  splitMultiDayEvents,
  groupByDay,
  isAllDay,
  toLocalDay,
} from './calendar';
import type { CalendarEvent } from '@dashboard/contracts';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'test',
  title: 'Test Event',
  subtitle: null,
  description: null,
  startDate: '2026-01-17T00:00:00Z',
  endDate: null,
  image: null,
  location: null,
  metadata: { type: 'episode', seriesId: 1, seasonNumber: 1, episodeNumber: 1 },
  indicatorColor: 'blue',
  links: [],
  ...overrides,
});

describe('splitMultiDayEvents', () => {
  test('returns single-day events as-is', () => {
    const events = [makeEvent({ startDate: '2026-01-17T00:00:00Z', endDate: '2026-01-17T23:59:59Z' })];
    const result = splitMultiDayEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0]!.startDate).toBe('2026-01-17T00:00:00Z');
  });

  test('splits multi-day events into daily events', () => {
    const events = [
      makeEvent({
        startDate: '2026-01-17T00:00:00Z',
        endDate: '2026-01-19T23:59:59Z',
      }),
    ];
    const result = splitMultiDayEvents(events);
    expect(result).toHaveLength(3);
    // endDate includes milliseconds from setUTCHours(23,59,59,999)
    expect(result[0]!.endDate).toMatch(/^2026-01-17T23:59:59/);
    expect(result[1]!.startDate).toMatch(/^2026-01-18T00:00:00/);
    expect(result[1]!.endDate).toMatch(/^2026-01-18T23:59:59/);
    expect(result[2]!.startDate).toMatch(/^2026-01-19T00:00:00/);
  });

  test('skips invalid ranges (start > end)', () => {
    const events = [
      makeEvent({
        startDate: '2026-01-19T00:00:00Z',
        endDate: '2026-01-17T23:59:59Z',
      }),
    ];
    const result = splitMultiDayEvents(events);
    expect(result).toHaveLength(0);
  });

  test('preserves events without endDate', () => {
    const events = [makeEvent({ endDate: null })];
    const result = splitMultiDayEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0]!.endDate).toBe(null);
  });
});

describe('groupByDay', () => {
  test('groups events by day', () => {
    const events = [
      makeEvent({ startDate: '2026-01-17T00:00:00Z', id: 'a' }),
      makeEvent({ startDate: '2026-01-17T12:00:00Z', id: 'b' }),
      makeEvent({ startDate: '2026-01-18T00:00:00Z', id: 'c' }),
    ];
    const result = groupByDay(events);
    expect(result.get('2026-01-17')).toHaveLength(2);
    // Check if key exists before asserting length
    const day18 = result.get('2026-01-18');
    expect(day18?.length ?? 0).toBe(1);
  });

  test('empty array returns empty map', () => {
    const result = groupByDay([]);
    expect(result.size).toBe(0);
  });
});

describe('isAllDay', () => {
  test('returns true for single-day event', () => {
    const event = makeEvent({
      startDate: '2026-01-17T00:00:00Z',
      endDate: '2026-01-17T23:59:59Z',
    });
    expect(isAllDay(event)).toBe(true);
  });

  test('returns true for event without endDate', () => {
    const event = makeEvent({ endDate: null });
    expect(isAllDay(event)).toBe(true);
  });

  test('returns false for multi-day event', () => {
    const event = makeEvent({
      startDate: '2026-01-17T00:00:00Z',
      endDate: '2026-01-19T23:59:59Z',
    });
    expect(isAllDay(event)).toBe(false);
  });
});

describe('toLocalDay', () => {
  test('converts ISO to YYYY-MM-DD', () => {
    expect(toLocalDay('2026-01-17T10:30:00Z')).toBe('2026-01-17');
  });

  test('handles timezone offset', () => {
    // Date is parsed in local timezone
    const result = toLocalDay('2026-01-17T00:00:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
