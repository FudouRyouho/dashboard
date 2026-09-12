import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCalendarEvent,
  safeValidateCalendarEvent,
  isCalendarEvent,
  validateMediaReleaseEvent,
  safeValidateMediaReleaseEvent,
  isMediaReleaseEvent,
  validateIntegrationInput,
  safeValidateIntegrationInput,
  validateIntegrationOutput,
  validateIntegrationPublic,
  validateResultStatus,
  safeValidateResultStatus,
  isResultStatus,
  isDataView,
  isIntegrationKind,
} from './validation.js';

test('validateCalendarEvent validates valid event', () => {
  const event = {
    id: 'evt-1',
    title: 'Test Event',
    subtitle: 'Subtitle',
    description: 'Description',
    startDate: '2026-01-15T10:00:00.000Z',
    endDate: '2026-01-15T12:00:00.000Z',
    image: null,
    location: 'Location',
    metadata: { type: 'other' },
    indicatorColor: '#ff0000',
    links: [],
  };
  const result = validateCalendarEvent(event);
  assert.equal(result.id, 'evt-1');
});

test('safeValidateCalendarEvent returns success for valid event', () => {
  const event = {
    id: 'evt-1',
    title: 'Test Event',
    subtitle: 'Subtitle',
    description: 'Description',
    startDate: '2026-01-15T10:00:00.000Z',
    endDate: '2026-01-15T12:00:00.000Z',
    image: null,
    location: 'Location',
    metadata: { type: 'other' },
    indicatorColor: '#ff0000',
    links: [],
  };
  const result = safeValidateCalendarEvent(event);
  assert.ok(result.success);
});

test('safeValidateCalendarEvent returns failure for invalid event', () => {
  const event = {
    id: 'evt-1',
    title: 'Test Event',
    // missing required fields
  };
  const result = safeValidateCalendarEvent(event);
  assert.ok(!result.success);
  assert.ok(result.error.issues.length > 0);
});

test('isCalendarEvent returns true for valid event', () => {
  const event = {
    id: 'evt-1',
    title: 'Test Event',
    subtitle: 'Subtitle',
    description: 'Description',
    startDate: '2026-01-15T10:00:00.000Z',
    endDate: '2026-01-15T12:00:00.000Z',
    image: null,
    location: 'Location',
    metadata: { type: 'other' },
    indicatorColor: '#ff0000',
    links: [],
  };
  assert.ok(isCalendarEvent(event));
});

test('isCalendarEvent returns false for invalid event', () => {
  const event = { id: 'evt-1' };
  assert.ok(!isCalendarEvent(event));
});

test('validateMediaReleaseEvent validates movie', () => {
  const movie = {
    type: 'movie' as const,
    id: 'movie-1',
    title: 'Test Movie',
    description: 'Description',
    releaseDate: '2026-01-15T10:00:00.000Z',
    runtimeMs: 7200000,
    studio: 'Studio',
    rating: 8.5,
    genres: ['Action'],
    imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
    href: 'https://example.com/movie/1',
  };
  const result = validateMediaReleaseEvent(movie);
  assert.equal(result.type, 'movie');
  assert.equal(result.title, 'Test Movie');
});

test('validateMediaReleaseEvent validates episode', () => {
  const episode = {
    type: 'episode' as const,
    id: 'ep-1',
    title: 'Episode 1',
    description: 'Description',
    releaseDate: '2026-01-15T10:00:00.000Z',
    seriesTitle: 'Series',
    seriesId: 'series-1',
    seasonNumber: 1,
    episodeNumber: 1,
    imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
    href: 'https://example.com/episode/1',
  };
  const result = validateMediaReleaseEvent(episode);
  assert.equal(result.type, 'episode');
});

test('validateMediaReleaseEvent validates series', () => {
  const series = {
    type: 'series' as const,
    id: 'series-1',
    title: 'Test Series',
    description: 'Description',
    releaseDate: '2026-01-15T10:00:00.000Z',
    firstAired: '2025-01-01T00:00:00.000Z',
    childCount: 10,
    status: 'Continuing',
    imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
    href: 'https://example.com/series/1',
  };
  const result = validateMediaReleaseEvent(series);
  assert.equal(result.type, 'series');
});

test('safeValidateMediaReleaseEvent returns success for valid release', () => {
  const movie = {
    type: 'movie' as const,
    id: 'movie-1',
    title: 'Test Movie',
    description: 'Description',
    releaseDate: '2026-01-15T10:00:00.000Z',
    runtimeMs: 7200000,
    studio: 'Studio',
    rating: 8.5,
    genres: ['Action'],
    imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
    href: 'https://example.com/movie/1',
  };
  const result = safeValidateMediaReleaseEvent(movie);
  assert.ok(result.success);
});

test('safeValidateMediaReleaseEvent returns failure for invalid release', () => {
  const release = { type: 'movie', id: 'movie-1' };
  const result = safeValidateMediaReleaseEvent(release);
  assert.ok(!result.success);
});

test('isMediaReleaseEvent returns true for valid release', () => {
  const movie = {
    type: 'movie' as const,
    id: 'movie-1',
    title: 'Test Movie',
    description: 'Description',
    releaseDate: '2026-01-15T10:00:00.000Z',
    runtimeMs: 7200000,
    studio: 'Studio',
    rating: 8.5,
    genres: ['Action'],
    imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
    href: 'https://example.com/movie/1',
  };
  assert.ok(isMediaReleaseEvent(movie));
});

test('isMediaReleaseEvent returns false for invalid release', () => {
  assert.ok(!isMediaReleaseEvent({ type: 'movie' }));
});

test('validateIntegrationInput validates base input', () => {
  const input = {
    id: 'int-1',
    name: 'Test',
    url: 'https://example.com',
  };
  const result = validateIntegrationInput(input);
  assert.equal(result.id, 'int-1');
});

test('safeValidateIntegrationInput returns success for valid input', () => {
  const input = { id: 'int-1', name: 'Test', url: 'https://example.com' };
  const result = safeValidateIntegrationInput(input);
  assert.ok(result.success);
});

test('safeValidateIntegrationInput returns failure for invalid input', () => {
  const input = { id: 'int-1', name: 'Test' }; // missing url
  const result = safeValidateIntegrationInput(input);
  assert.ok(!result.success);
});

test('validateIntegrationOutput validates output', () => {
  const output = {
    id: 'int-1',
    kind: 'sonarr' as const,
    name: 'Test',
    url: 'https://example.com',
    externalUrl: null,
    port: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = validateIntegrationOutput(output);
  assert.equal(result.id, 'int-1');
});

test('validateIntegrationPublic validates public schema', () => {
  const pub = {
    kind: 'sonarr' as const,
    id: 'int-1',
    name: 'Test',
    url: 'https://example.com',
  };
  const result = validateIntegrationPublic(pub);
  assert.equal(result.kind, 'sonarr');
});

test('validateResultStatus validates valid status with success', () => {
  const status = {
    data: { obtainedAt: '2026-01-15T10:00:00.000Z' },
    attempt: { outcome: 'success' as const, at: '2026-01-15T10:00:00.000Z' },
  };
  const result = validateResultStatus(status);
  assert.equal(result.attempt?.outcome, 'success');
});

test('validateResultStatus validates valid status with failure', () => {
  const status = {
    data: { obtainedAt: '2026-01-15T10:00:00.000Z' },
    attempt: { outcome: 'failure' as const, at: '2026-01-15T10:00:00.000Z', reason: 'timeout' as const },
  };
  const result = validateResultStatus(status);
  if (result.attempt && result.attempt.outcome === 'failure') {
    assert.equal(result.attempt.reason, 'timeout');
  }
});

test('validateResultStatus validates status with null data and attempt', () => {
  const status = {
    data: null,
    attempt: null,
  };
  const result = validateResultStatus(status);
  assert.equal(result.data, null);
  assert.equal(result.attempt, null);
});

test('safeValidateResultStatus returns success for valid status', () => {
  const status = { data: null, attempt: null };
  const result = safeValidateResultStatus(status);
  assert.ok(result.success);
});

test('safeValidateResultStatus returns failure for invalid status', () => {
  const status = { data: 'invalid', attempt: null };
  const result = safeValidateResultStatus(status);
  assert.ok(!result.success);
});

test('isResultStatus returns true for valid status', () => {
  const status = { data: null, attempt: null };
  assert.ok(isResultStatus(status));
});

test('isResultStatus returns false for invalid status', () => {
  assert.ok(!isResultStatus({ data: 'invalid' }));
});

test('isDataView returns true for valid views', () => {
  assert.ok(isDataView('never-queried'));
  assert.ok(isDataView('fresh'));
  assert.ok(isDataView('outdated'));
  assert.ok(isDataView('missing'));
});

test('isDataView returns false for invalid view', () => {
  assert.ok(!isDataView('invalid'));
  assert.ok(!isDataView(''));
  assert.ok(!isDataView(null));
});

test('isIntegrationKind returns true for valid kinds', () => {
  assert.ok(isIntegrationKind('sonarr'));
  assert.ok(isIntegrationKind('radarr'));
  assert.ok(isIntegrationKind('jellyfin'));
  assert.ok(isIntegrationKind('docker'));
});

test('isIntegrationKind returns false for invalid kind', () => {
  assert.ok(!isIntegrationKind('invalid'));
  assert.ok(!isIntegrationKind(''));
});