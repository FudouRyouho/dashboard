import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { IntegrationError, classifyIntegrationError } from './integration-error.js';

test('classifyIntegrationError returns IntegrationError reason and httpStatus', () => {
  const err = new IntegrationError('unauthorized', 'Access denied', 403);
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unauthorized');
  assert.equal(result.httpStatus, 403);
});

test('classifyIntegrationError returns invalid-response for ZodError', () => {
  const zodError = new z.ZodError([]);
  const result = classifyIntegrationError(zodError);
  assert.equal(result.reason, 'invalid-response');
  assert.equal(result.httpStatus, undefined);
});

test('classifyIntegrationError returns timeout for TimeoutError', () => {
  const err = new Error('Timeout') as Error & { name: string };
  err.name = 'TimeoutError';
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'timeout');
});

test('classifyIntegrationError returns timeout for AbortError', () => {
  const err = new Error('Aborted') as Error & { name: string };
  err.name = 'AbortError';
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'timeout');
});

test('classifyIntegrationError returns unreachable for ECONNREFUSED', () => {
  const err = new Error('Connection refused') as Error & { cause?: { code?: string } };
  err.cause = { code: 'ECONNREFUSED' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unreachable for ENOTFOUND', () => {
  const err = new Error('Not found') as Error & { cause?: { code?: string } };
  err.cause = { code: 'ENOTFOUND' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unreachable for EHOSTUNREACH', () => {
  const err = new Error('Host unreachable') as Error & { cause?: { code?: string } };
  err.cause = { code: 'EHOSTUNREACH' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unreachable for ENETUNREACH', () => {
  const err = new Error('Network unreachable') as Error & { cause?: { code?: string } };
  err.cause = { code: 'ENETUNREACH' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unreachable for ECONNRESET', () => {
  const err = new Error('Connection reset') as Error & { cause?: { code?: string } };
  err.cause = { code: 'ECONNRESET' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unreachable for EAI_AGAIN', () => {
  const err = new Error('DNS lookup failed') as Error & { cause?: { code?: string } };
  err.cause = { code: 'EAI_AGAIN' };
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unreachable');
});

test('classifyIntegrationError returns unknown for unclassified errors', () => {
  const err = new Error('Something went wrong');
  const result = classifyIntegrationError(err);
  assert.equal(result.reason, 'unknown');
});

test('classifyIntegrationError returns unknown for non-Error objects', () => {
  const result = classifyIntegrationError('string error');
  assert.equal(result.reason, 'unknown');
});

test('classifyIntegrationError returns unknown for null', () => {
  const result = classifyIntegrationError(null);
  assert.equal(result.reason, 'unknown');
});

test('IntegrationError.fromHttpResponse creates unauthorized for 401', () => {
  const err = IntegrationError.fromHttpResponse(401, 'Unauthorized');
  assert.equal(err.reason, 'unauthorized');
  assert.equal(err.httpStatus, 401);
});

test('IntegrationError.fromHttpResponse creates forbidden for 403', () => {
  const err = IntegrationError.fromHttpResponse(403, 'Forbidden');
  assert.equal(err.reason, 'forbidden');
  assert.equal(err.httpStatus, 403);
});

test('IntegrationError.fromHttpResponse creates unknown for other status codes', () => {
  const err = IntegrationError.fromHttpResponse(500, 'Internal Server Error');
  assert.equal(err.reason, 'unknown');
  assert.equal(err.httpStatus, 500);
});

test('IntegrationError.has correct name property', () => {
  const err = new IntegrationError('timeout', 'Timed out');
  assert.equal(err.name, 'IntegrationError');
});
