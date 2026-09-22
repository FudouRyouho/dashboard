import { describe, test, expect } from 'vitest';
import { serverCalendarWindow } from './calendar-window';

describe('serverCalendarWindow', () => {
  test('December: start falls in November of the same year', () => {
    const { start } = serverCalendarWindow(new Date('2026-12-15T12:00:00Z'));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(10); // November (0-indexed)
  });

  test('January: start falls in December of the previous year', () => {
    const { start } = serverCalendarWindow(new Date('2026-01-15T12:00:00Z'));
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(11); // December (0-indexed)
  });

  test('February: end falls in March (last day, not April 0)', () => {
    const { end } = serverCalendarWindow(new Date('2026-02-15T12:00:00Z'));
    expect(end.getMonth()).toBe(2); // March (0-indexed)
    expect(end.getDate()).toBe(31);
  });
});