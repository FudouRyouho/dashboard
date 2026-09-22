import { test, expect } from 'vitest';
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
  expect(result.id).toBe('evt-1');
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
  expect(result.success).toBeTruthy();
});

test('safeValidateCalendarEvent returns failure for invalid event', () => {
  const event = {
    id: 'evt-1',
    title: 'Test Event',
    // missing required fields
  };
  const result = safeValidateCalendarEvent(event);
  expect(!result.success).toBeTruthy();
  expect(result.success === false).toBeTruthy();
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
  expect(isCalendarEvent(event)).toBeTruthy();
});

test('isCalendarEvent returns false for invalid event', () => {
  const event = { id: 'evt-1' };
  expect(!isCalendarEvent(event)).toBeTruthy();
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
  expect(result.type).toBe('movie');
  expect(result.title).toBe('Test Movie');
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
  expect(result.type).toBe('episode');
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
  expect(result.type).toBe('series');
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
  expect(result.success).toBeTruthy();
});

test('safeValidateMediaReleaseEvent returns failure for invalid release', () => {
  const release = { type: 'movie', id: 'movie-1' };
  const result = safeValidateMediaReleaseEvent(release);
  expect(!result.success).toBeTruthy();
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
  expect(isMediaReleaseEvent(movie)).toBeTruthy();
});

test('isMediaReleaseEvent returns false for invalid release', () => {
  expect(!isMediaReleaseEvent({ type: 'movie' })).toBeTruthy();
});

test('validateIntegrationInput validates base input', () => {
  const input = {
    id: 'int-1',
    name: 'Test',
    url: 'https://example.com',
  };
  const result = validateIntegrationInput(input);
  expect(result.id).toBe('int-1');
});

test('safeValidateIntegrationInput returns success for valid input', () => {
  const input = { id: 'int-1', name: 'Test', url: 'https://example.com' };
  const result = safeValidateIntegrationInput(input);
  expect(result.success).toBeTruthy();
});

test('safeValidateIntegrationInput returns failure for invalid input', () => {
  const input = { id: 'int-1', name: 'Test' }; // missing url
  const result = safeValidateIntegrationInput(input);
  expect(!result.success).toBeTruthy();
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
  expect(result.id).toBe('int-1');
});

test('validateIntegrationPublic validates public schema', () => {
  const pub = {
    kind: 'sonarr' as const,
    id: 'int-1',
    name: 'Test',
    url: 'https://example.com',
  };
  const result = validateIntegrationPublic(pub);
  expect(result.kind).toBe('sonarr');
});

test('validateResultStatus validates valid status with success', () => {
  const status = {
    data: { obtainedAt: '2026-01-15T10:00:00.000Z' },
    attempt: { outcome: 'success' as const, at: '2026-01-15T10:00:00.000Z' },
  };
  const result = validateResultStatus(status);
  expect(result.attempt?.outcome).toBe('success');
});

test('validateResultStatus validates valid status with failure', () => {
  const status = {
    data: { obtainedAt: '2026-01-15T10:00:00.000Z' },
    attempt: { outcome: 'failure' as const, at: '2026-01-15T10:00:00.000Z', reason: 'timeout' as const },
  };
  const result = validateResultStatus(status);
  if (result.attempt && result.attempt.outcome === 'failure') {
    expect(result.attempt.reason).toBe('timeout');
  }
});

test('validateResultStatus validates status with null data and attempt', () => {
  const status = {
    data: null,
    attempt: null,
  };
  const result = validateResultStatus(status);
  expect(result.data).toBe(null);
  expect(result.attempt).toBe(null);
});

test('safeValidateResultStatus returns success for valid status', () => {
  const status = { data: null, attempt: null };
  const result = safeValidateResultStatus(status);
  expect(result.success).toBeTruthy();
});

test('safeValidateResultStatus returns failure for invalid status', () => {
  const status = { data: 'invalid', attempt: null };
  const result = safeValidateResultStatus(status);
  expect(!result.success).toBeTruthy();
});

test('isResultStatus returns true for valid status', () => {
  const status = { data: null, attempt: null };
  expect(isResultStatus(status)).toBeTruthy();
});

test('isResultStatus returns false for invalid status', () => {
  expect(!isResultStatus({ data: 'invalid' })).toBeTruthy();
});

test('isDataView returns true for valid views', () => {
  expect(isDataView('never-queried')).toBeTruthy();
  expect(isDataView('fresh')).toBeTruthy();
  expect(isDataView('outdated')).toBeTruthy();
  expect(isDataView('missing')).toBeTruthy();
});

test('isDataView returns false for invalid view', () => {
  expect(!isDataView('invalid')).toBeTruthy();
  expect(!isDataView('')).toBeTruthy();
  expect(!isDataView(null)).toBeTruthy();
});

test('isIntegrationKind returns true for valid kinds', () => {
  expect(isIntegrationKind('sonarr')).toBeTruthy();
  expect(isIntegrationKind('radarr')).toBeTruthy();
  expect(isIntegrationKind('jellyfin')).toBeTruthy();
  expect(isIntegrationKind('docker')).toBeTruthy();
});

test('isIntegrationKind returns false for invalid kind', () => {
  expect(!isIntegrationKind('invalid')).toBeTruthy();
  expect(!isIntegrationKind('')).toBeTruthy();
});