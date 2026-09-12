import test from 'node:test';
import assert from 'node:assert/strict';
import { removeTrailingSlash } from './url.js';

test('removeTrailingSlash removes single trailing slash', () => {
  assert.equal(removeTrailingSlash('http://example.com/'), 'http://example.com');
});

test('removeTrailingSlash removes multiple trailing slashes', () => {
  assert.equal(removeTrailingSlash('http://example.com///'), 'http://example.com');
});

test('removeTrailingSlash does not modify path without trailing slash', () => {
  assert.equal(removeTrailingSlash('http://example.com'), 'http://example.com');
});

test('removeTrailingSlash handles empty string', () => {
  assert.equal(removeTrailingSlash(''), '');
});

test('removeTrailingSlash handles root path', () => {
  assert.equal(removeTrailingSlash('/'), '');
});

test('removeTrailingSlash preserves internal slashes', () => {
  assert.equal(removeTrailingSlash('http://example.com/path/to/resource/'), 'http://example.com/path/to/resource');
});
