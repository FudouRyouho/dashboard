import { test, expect } from 'vitest';
import {
  validateTaskRunDetail,
  safeValidateTaskRunDetail,
  validateCalendarSnapshotData,
  safeValidateCalendarSnapshotData,
  validateMediaReleasesSnapshotData,
  safeValidateMediaReleasesSnapshotData,
  validatePurgeSnapshotData,
  safeValidatePurgeSnapshotData,
  validateSnapshotData,
  safeValidateSnapshotData,
} from './json-schemas.js';

test('validateTaskRunDetail validates error object', () => {
  const detail = { error: 'timeout', code: 504, message: 'Connection timed out' };
  const result = validateTaskRunDetail(detail);
  expect(result !== null).toBeTruthy();
  expect(result!.error).toBe('timeout');
  expect(result!.code).toBe(504);
});

test('validateTaskRunDetail validates null', () => {
  const result = validateTaskRunDetail(null);
  expect(result).toBeNull();
});

test('safeValidateTaskRunDetail returns success for valid detail', () => {
  const detail = { error: 'timeout', code: 504 };
  const result = safeValidateTaskRunDetail(detail);
  expect(result.success).toBeTruthy();
});

test('safeValidateTaskRunDetail returns failure for invalid detail', () => {
  const detail = 'not an object';
  const result = safeValidateTaskRunDetail(detail);
  expect(!result.success).toBeTruthy();
});

test('validateCalendarSnapshotData validates events array', () => {
  const data = {
    events: [{
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
    }],
  };
  const result = validateCalendarSnapshotData(data);
  expect(result.events.length > 0).toBeTruthy();
  expect(result.events[0]!.title).toBe('Test Event');
});

test('safeValidateCalendarSnapshotData returns success for valid data', () => {
  const data = {
    events: [{
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
    }],
  };
  const result = safeValidateCalendarSnapshotData(data);
  expect(result.success).toBeTruthy();
});

test('validateMediaReleasesSnapshotData validates movie release', () => {
  const data = {
    releases: [{
      type: 'movie',
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
    }],
  };
  const result = validateMediaReleasesSnapshotData(data);
  expect(result.releases.length).toBe(1);
  expect(result.releases[0]?.type).toBe('movie');
});

test('validateMediaReleasesSnapshotData validates episode release', () => {
  const data = {
    releases: [{
      type: 'episode',
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
    }],
  };
  const result = validateMediaReleasesSnapshotData(data);
  expect(result.releases[0]?.type).toBe('episode');
});

test('validateMediaReleasesSnapshotData validates series release', () => {
  const data = {
    releases: [{
      type: 'series',
      id: 'series-1',
      title: 'Test Series',
      description: 'Description',
      releaseDate: '2026-01-15T10:00:00.000Z',
      firstAired: '2025-01-01T00:00:00.000Z',
      childCount: 10,
      status: 'Continuing',
      imageUrls: { poster: 'https://example.com/poster.jpg', backdrop: 'https://example.com/backdrop.jpg' },
      href: 'https://example.com/series/1',
    }],
  };
  const result = validateMediaReleasesSnapshotData(data);
  expect(result.releases[0]?.type).toBe('series');
});

test('safeValidateMediaReleasesSnapshotData returns success for valid data', () => {
  const data = {
    releases: [{
      type: 'movie',
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
    }],
  };
  const result = safeValidateMediaReleasesSnapshotData(data);
  expect(result.success).toBeTruthy();
});

test('validatePurgeSnapshotData validates purge result', () => {
  const data = { deleted: 5 };
  const result = validatePurgeSnapshotData(data);
  expect(result.deleted).toBe(5);
});

test('safeValidatePurgeSnapshotData returns success for valid data', () => {
  const data = { deleted: 3 };
  const result = safeValidatePurgeSnapshotData(data);
  expect(result.success).toBeTruthy();
});

test('validateSnapshotData accepts calendar data', () => {
  const data = {
    events: [{
      id: 'evt-1',
      title: 'Test Event',
      subtitle: null,
      description: null,
      startDate: '2026-01-15T10:00:00.000Z',
      endDate: null,
      image: null,
      location: null,
      metadata: { type: 'other' },
      indicatorColor: '#ff0000',
      links: [],
    }],
  };
  const result = validateSnapshotData(data);
  expect(result && 'events' in result).toBeTruthy();
});

test('validateSnapshotData accepts media releases data', () => {
  const data = {
    releases: [{
      type: 'movie',
      id: 'movie-1',
      title: 'Test Movie',
      description: null,
      releaseDate: null,
      runtimeMs: null,
      studio: null,
      rating: null,
      genres: [],
      imageUrls: { poster: null, backdrop: null },
      href: 'https://example.com/movie/1',
    }],
  };
  const result = validateSnapshotData(data);
  expect(result && 'releases' in result).toBeTruthy();
});

test('validateSnapshotData accepts purge data', () => {
  const data = { deleted: 10 };
  const result = validateSnapshotData(data);
  expect(result?.deleted).toBe(10);
});

test('validateSnapshotData accepts unknown object', () => {
  const data = { customField: 'customValue' };
  const result = validateSnapshotData(data);
  expect(result.customField).toBe('customValue');
});

test('safeValidateSnapshotData returns success for valid data', () => {
  const data = { deleted: 1 };
  const result = safeValidateSnapshotData(data);
  expect(result.success).toBeTruthy();
});

test('safeValidateSnapshotData returns failure for completely invalid', () => {
  const data = 'not an object';
  const result = safeValidateSnapshotData(data);
  expect(!result.success).toBeTruthy();
});