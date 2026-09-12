import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toISOStringSafe,
  parseISODate,
  startOfDay,
  endOfDay,
  addMonths,
  subtractMonths,
} from './date.js';

test('toISOStringSafe returns ISO string for valid date', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = toISOStringSafe(date);
  assert.equal(result, '2026-01-15T10:30:00.000Z');
});

test('toISOStringSafe returns null for undefined', () => {
  const result = toISOStringSafe(undefined);
  assert.equal(result, null);
});

test('toISOStringSafe returns null for null', () => {
  const result = toISOStringSafe(null as any);
  assert.equal(result, null);
});

test('parseISODate parses valid ISO string', () => {
  const result = parseISODate('2026-01-15T10:30:00.000Z');
  assert.ok(result instanceof Date);
  assert.equal(result!.toISOString(), '2026-01-15T10:30:00.000Z');
});

test('parseISODate returns null for invalid string', () => {
  const result = parseISODate('not-a-date');
  assert.equal(result, null);
});

test('parseISODate returns null for empty string', () => {
  const result = parseISODate('');
  assert.equal(result, null);
});

test('startOfDay returns midnight of same day', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = startOfDay(date);
  assert.equal(result.getHours(), 0);
  assert.equal(result.getMinutes(), 0);
  assert.equal(result.getSeconds(), 0);
  assert.equal(result.getMilliseconds(), 0);
});

test('endOfDay returns 23:59:59.999 of same day', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = endOfDay(date);
  assert.equal(result.getHours(), 23);
  assert.equal(result.getMinutes(), 59);
  assert.equal(result.getSeconds(), 59);
  assert.equal(result.getMilliseconds(), 999);
});

test('addMonths adds months correctly', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = addMonths(date, 2);
  assert.equal(result.getMonth(), 2); // March (0-indexed)
  assert.equal(result.getFullYear(), 2026);
});

test('addMonths handles year overflow', () => {
  const date = new Date('2026-11-15T10:30:00.000Z');
  const result = addMonths(date, 3);
  assert.equal(result.getMonth(), 1); // February
  assert.equal(result.getFullYear(), 2027);
});

test('subtractMonths subtracts months correctly', () => {
  const date = new Date('2026-03-15T10:30:00.000Z');
  const result = subtractMonths(date, 1);
  assert.equal(result.getMonth(), 1); // February
  assert.equal(result.getFullYear(), 2026);
});

test('subtractMonths handles year underflow', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = subtractMonths(date, 3);
  assert.equal(result.getMonth(), 9); // October
  assert.equal(result.getFullYear(), 2025);
});