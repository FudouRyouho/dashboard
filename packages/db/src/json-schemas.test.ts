import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.ok(result !== null);
  assert.equal(result.error, 'timeout');
  assert.equal(result.code, 504);
});

test('validateTaskRunDetail validates null', () => {
  const result = validateTaskRunDetail(null);
  assert.strictEqual(result, null);
});

test('safeValidateTaskRunDetail returns success for valid detail', () => {
  const detail = { error: 'timeout', code: 504 };
  const result = safeValidateTaskRunDetail(detail);
  assert.ok(result.success);
});

test('safeValidateTaskRunDetail returns failure for invalid detail', () => {
  const detail = 'not an object';
  const result = safeValidateTaskRunDetail(detail);
  assert.ok(!result.success);
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
  assert.ok(result.events.length > 0);
  assert.equal(result.events[0]!.title, 'Test Event');
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
  assert.ok(result.success);
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
  assert.equal(result.releases.length, 1);
  assert.equal(result.releases[0]?.type, 'movie');
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
  assert.equal(result.releases[0]?.type, 'episode');
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
  assert.equal(result.releases[0]?.type, 'series');
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
  assert.ok(result.success);
});

test('validatePurgeSnapshotData validates purge result', () => {
  const data = { deleted: 5 };
  const result = validatePurgeSnapshotData(data);
  assert.equal(result.deleted, 5);
});

test('safeValidatePurgeSnapshotData returns success for valid data', () => {
  const data = { deleted: 3 };
  const result = safeValidatePurgeSnapshotData(data);
  assert.ok(result.success);
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
  assert.ok(result && 'events' in result);
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
  assert.ok(result && 'releases' in result);
});

test('validateSnapshotData accepts purge data', () => {
  const data = { deleted: 10 };
  const result = validateSnapshotData(data);
  assert.equal(result?.deleted, 10);
});

test('validateSnapshotData accepts unknown object', () => {
  const data = { customField: 'customValue' };
  const result = validateSnapshotData(data);
  assert.equal(result.customField, 'customValue');
});

test('safeValidateSnapshotData returns success for valid data', () => {
  const data = { deleted: 1 };
  const result = safeValidateSnapshotData(data);
  assert.ok(result.success);
});

test('safeValidateSnapshotData returns failure for completely invalid', () => {
  const data = 'not an object';
  const result = safeValidateSnapshotData(data);
  assert.ok(!result.success);
});