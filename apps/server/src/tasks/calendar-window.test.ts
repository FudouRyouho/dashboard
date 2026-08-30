import test from 'node:test';
import assert from 'node:assert/strict';
import { serverCalendarWindow } from './calendar-window';

test('diciembre: start cae en noviembre del mismo año', () => {
  const { start } = serverCalendarWindow(new Date('2026-12-15T12:00:00Z'));
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 10);
});

test('enero: start cae en diciembre del año anterior', () => {
  const { start } = serverCalendarWindow(new Date('2026-01-15T12:00:00Z'));
  assert.equal(start.getFullYear(), 2025);
  assert.equal(start.getMonth(), 11);
});

test('febrero: end cae en marzo (último día, no 0 de abril)', () => {
  const { end } = serverCalendarWindow(new Date('2026-02-15T12:00:00Z'));
  assert.equal(end.getMonth(), 2);
  assert.equal(end.getDate(), 31);
});
