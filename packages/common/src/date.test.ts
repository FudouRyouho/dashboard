import { test, expect } from 'vitest';
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
  expect(result).toBe('2026-01-15T10:30:00.000Z');
});

test('toISOStringSafe returns null for undefined', () => {
  const result = toISOStringSafe(undefined);
  expect(result).toBe(null);
});

test('toISOStringSafe returns null for null', () => {
  const result = toISOStringSafe(null as any);
  expect(result).toBe(null);
});

test('parseISODate parses valid ISO string', () => {
  const result = parseISODate('2026-01-15T10:30:00.000Z');
  expect(result instanceof Date).toBeTruthy();
  expect(result!.toISOString()).toBe('2026-01-15T10:30:00.000Z');
});

test('parseISODate returns null for invalid string', () => {
  const result = parseISODate('not-a-date');
  expect(result).toBe(null);
});

test('parseISODate returns null for empty string', () => {
  const result = parseISODate('');
  expect(result).toBe(null);
});

test('startOfDay returns midnight of same day', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = startOfDay(date);
  expect(result.getHours()).toBe(0);
  expect(result.getMinutes()).toBe(0);
  expect(result.getSeconds()).toBe(0);
  expect(result.getMilliseconds()).toBe(0);
});

test('endOfDay returns 23:59:59.999 of same day', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = endOfDay(date);
  expect(result.getHours()).toBe(23);
  expect(result.getMinutes()).toBe(59);
  expect(result.getSeconds()).toBe(59);
  expect(result.getMilliseconds()).toBe(999);
});

test('addMonths adds months correctly', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = addMonths(date, 2);
  expect(result.getMonth()).toBe(2); // March (0-indexed)
  expect(result.getFullYear()).toBe(2026);
});

test('addMonths handles year overflow', () => {
  const date = new Date('2026-11-15T10:30:00.000Z');
  const result = addMonths(date, 3);
  expect(result.getMonth()).toBe(1); // February
  expect(result.getFullYear()).toBe(2027);
});

test('subtractMonths subtracts months correctly', () => {
  const date = new Date('2026-03-15T10:30:00.000Z');
  const result = subtractMonths(date, 1);
  expect(result.getMonth()).toBe(1); // February
  expect(result.getFullYear()).toBe(2026);
});

test('subtractMonths handles year underflow', () => {
  const date = new Date('2026-01-15T10:30:00.000Z');
  const result = subtractMonths(date, 3);
  expect(result.getMonth()).toBe(9); // October
  expect(result.getFullYear()).toBe(2025);
});