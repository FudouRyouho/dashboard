import test from 'node:test';
import assert from 'node:assert/strict';
import {
  joinPaths,
  ensureSuffix,
  ensurePrefix,
  truncate,
  formatBytes,
} from './string.js';
import { removeTrailingSlash } from './url.js';

test('joinPaths joins paths correctly', () => {
  assert.equal(joinPaths('http://example.com', 'api', 'v1'), 'http://example.com/api/v1');
  assert.equal(joinPaths('http://example.com/', '/api/', '/v1/'), 'http://example.com/api/v1');
  assert.equal(joinPaths('http://example.com', 'api', ''), 'http://example.com/api');
  assert.equal(joinPaths('', 'api', 'v1'), 'api/v1');
});

test('ensureSuffix adds suffix when missing', () => {
  assert.equal(ensureSuffix('http://example.com', '/'), 'http://example.com/');
  assert.equal(ensureSuffix('file', '.txt'), 'file.txt');
});

test('ensureSuffix does not duplicate suffix', () => {
  assert.equal(ensureSuffix('file.txt', '.txt'), 'file.txt');
  assert.equal(ensureSuffix('http://example.com/', '/'), 'http://example.com/');
});

test('ensurePrefix adds prefix when missing', () => {
  assert.equal(ensurePrefix('path', '/'), '/path');
  assert.equal(ensurePrefix('example.com', 'http://'), 'http://example.com');
});

test('ensurePrefix does not duplicate prefix', () => {
  assert.equal(ensurePrefix('/path', '/'), '/path');
  assert.equal(ensurePrefix('http://example.com', 'http://'), 'http://example.com');
});

test('truncate truncates long strings', () => {
  assert.equal(truncate('hello world', 8), 'hello wo...');
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('', 5), '');
});

test('formatBytes formats bytes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512.00 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1536), '1.50 KB');
  assert.equal(formatBytes(1024 * 1024), '1.00 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1.00 GB');
});

test('removeTrailingSlash removes trailing slashes', () => {
  assert.equal(removeTrailingSlash('http://example.com/'), 'http://example.com');
  assert.equal(removeTrailingSlash('http://example.com///'), 'http://example.com');
  assert.equal(removeTrailingSlash('http://example.com'), 'http://example.com');
  assert.equal(removeTrailingSlash(''), '');
});