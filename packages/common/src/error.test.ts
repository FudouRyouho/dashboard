import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError, toError, isAppError } from './error.js';

test('AppError creates error with code and message', () => {
  const err = new AppError('NOT_FOUND', 'Resource not found');
  assert.equal(err.code, 'NOT_FOUND');
  assert.equal(err.message, 'Resource not found');
  assert.equal(err.name, 'AppError');
});

test('AppError preserves cause', () => {
  const cause = new Error('Original error');
  const err = new AppError('WRAPPED', 'Wrapped error', cause);
  assert.equal(err.cause, cause);
});

test('toError returns Error as-is', () => {
  const original = new Error('Original');
  const result = toError(original);
  assert.equal(result, original);
});

test('toError converts string to Error', () => {
  const result = toError('string error');
  assert.ok(result instanceof Error);
  assert.equal(result.message, 'string error');
});

test('toError converts null to Error', () => {
  const result = toError(null);
  assert.ok(result instanceof Error);
  assert.equal(result.message, 'null');
});

test('toError converts object to Error', () => {
  const result = toError({ foo: 'bar' });
  assert.ok(result instanceof Error);
  assert.ok(result.message.includes('bar') || result.message.includes('foo'));
});

test('isAppError returns true for AppError', () => {
  const err = new AppError('TEST', 'test');
  assert.ok(isAppError(err));
});

test('isAppError returns false for regular Error', () => {
  const err = new Error('regular');
  assert.ok(!isAppError(err));
});

test('isAppError returns false for non-Error', () => {
  assert.ok(!isAppError('string'));
  assert.ok(!isAppError(null));
  assert.ok(!isAppError(123));
  assert.ok(!isAppError({}));
});