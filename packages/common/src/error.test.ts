import { test, expect } from 'vitest';
import { AppError, toError, isAppError } from './error.js';

test('AppError creates error with code and message', () => {
  const err = new AppError('NOT_FOUND', 'Resource not found');
  expect(err.code).toBe('NOT_FOUND');
  expect(err.message).toBe('Resource not found');
  expect(err.name).toBe('AppError');
});

test('AppError preserves cause', () => {
  const cause = new Error('Original error');
  const err = new AppError('WRAPPED', 'Wrapped error', cause);
  expect(err.cause).toBe(cause);
});

test('toError returns Error as-is', () => {
  const original = new Error('Original');
  const result = toError(original);
  expect(result).toBe(original);
});

test('toError converts string to Error', () => {
  const result = toError('string error');
  expect(result instanceof Error).toBeTruthy();
  expect(result.message).toBe('string error');
});

test('toError converts null to Error', () => {
  const result = toError(null);
  expect(result instanceof Error).toBeTruthy();
  expect(result.message).toBe('null');
});

test('toError converts object to Error', () => {
  const result = toError({ foo: 'bar' });
  expect(result instanceof Error).toBeTruthy();
  expect(result.message.includes('bar') || result.message.includes('foo')).toBeTruthy();
});

test('isAppError returns true for AppError', () => {
  const err = new AppError('TEST', 'test');
  expect(isAppError(err)).toBeTruthy();
});

test('isAppError returns false for regular Error', () => {
  const err = new Error('regular');
  expect(!isAppError(err)).toBeTruthy();
});

test('isAppError returns false for non-Error', () => {
  expect(!isAppError('string')).toBeTruthy();
  expect(!isAppError(null)).toBeTruthy();
  expect(!isAppError(123)).toBeTruthy();
  expect(!isAppError({})).toBeTruthy();
});