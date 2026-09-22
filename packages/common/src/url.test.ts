import { test, expect } from 'vitest';
import { removeTrailingSlash } from './url.js';

test('removeTrailingSlash removes single trailing slash', () => {
  expect(removeTrailingSlash('http://example.com/')).toBe('http://example.com');
});

test('removeTrailingSlash removes multiple trailing slashes', () => {
  expect(removeTrailingSlash('http://example.com///')).toBe('http://example.com');
});

test('removeTrailingSlash does not modify path without trailing slash', () => {
  expect(removeTrailingSlash('http://example.com')).toBe('http://example.com');
});

test('removeTrailingSlash handles empty string', () => {
  expect(removeTrailingSlash('')).toBe('');
});

test('removeTrailingSlash handles root path', () => {
  expect(removeTrailingSlash('/')).toBe('');
});

test('removeTrailingSlash preserves internal slashes', () => {
  expect(removeTrailingSlash('http://example.com/path/to/resource/')).toBe('http://example.com/path/to/resource');
});
