import { test, expect } from 'vitest';
import {
  joinPaths,
  ensureSuffix,
  ensurePrefix,
  truncate,
  formatBytes,
} from './string.js';
import { removeTrailingSlash } from './url.js';

test('joinPaths joins paths correctly', () => {
  expect(joinPaths('http://example.com', 'api', 'v1')).toBe('http://example.com/api/v1');
  expect(joinPaths('http://example.com/', '/api/', '/v1/')).toBe('http://example.com/api/v1');
  expect(joinPaths('http://example.com', 'api', '')).toBe('http://example.com/api');
  expect(joinPaths('', 'api', 'v1')).toBe('api/v1');
});

test('ensureSuffix adds suffix when missing', () => {
  expect(ensureSuffix('http://example.com', '/')).toBe('http://example.com/');
  expect(ensureSuffix('file', '.txt')).toBe('file.txt');
});

test('ensureSuffix does not duplicate suffix', () => {
  expect(ensureSuffix('file.txt', '.txt')).toBe('file.txt');
  expect(ensureSuffix('http://example.com/', '/')).toBe('http://example.com/');
});

test('ensurePrefix adds prefix when missing', () => {
  expect(ensurePrefix('path', '/')).toBe('/path');
  expect(ensurePrefix('example.com', 'http://')).toBe('http://example.com');
});

test('ensurePrefix does not duplicate prefix', () => {
  expect(ensurePrefix('/path', '/')).toBe('/path');
  expect(ensurePrefix('http://example.com', 'http://')).toBe('http://example.com');
});

test('truncate truncates long strings', () => {
  expect(truncate('hello world', 8)).toBe('hello wo...');
  expect(truncate('short', 10)).toBe('short');
  expect(truncate('', 5)).toBe('');
});

test('formatBytes formats bytes correctly', () => {
  expect(formatBytes(0)).toBe('0 B');
  expect(formatBytes(512)).toBe('512.00 B');
  expect(formatBytes(1024)).toBe('1.00 KB');
  expect(formatBytes(1536)).toBe('1.50 KB');
  expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
});

test('removeTrailingSlash removes trailing slashes', () => {
  expect(removeTrailingSlash('http://example.com/')).toBe('http://example.com');
  expect(removeTrailingSlash('http://example.com///')).toBe('http://example.com');
  expect(removeTrailingSlash('http://example.com')).toBe('http://example.com');
  expect(removeTrailingSlash('')).toBe('');
});