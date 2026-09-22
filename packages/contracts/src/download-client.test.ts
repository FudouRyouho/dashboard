import { test, expect } from 'vitest';
import { downloadClientItemSchema, downloadClientStatusSchema, downloadClientJobsAndStatusSchema } from './download-client.js';

test('downloadClientItemSchema parses a completed torrent (uploading state)', () => {
  const raw = {
    type: 'torrent',
    id: '3a5dd1d23ec3c226fda76e7adcba29932c4c2956',
    name: '[Erai-raws] Yomi no Tsugai - 23 [1080p CR WEB-DL AVC AAC][MultiSub][646BF528]',
    size: 1461514465,
    sent: 3166197570,
    downSpeed: 0,
    upSpeed: 14836,
    time: -1,
    added: 1789229463000,
    state: 'seeding' as const,
    progress: 1,
    category: 'delete',
  };

  const result = downloadClientItemSchema.parse(raw);
  expect(result.id).toBe(raw.id);
  expect(result.state).toBe('seeding');
  expect(result.progress).toBe(1);
  expect(result.size).toBe(1461514465);
});

test('downloadClientItemSchema parses a queued torrent (leeching state)', () => {
  const raw = {
    type: 'torrent',
    id: 'b2979708e3b4920562ecd0b4af9dee906a7bb19f',
    name: '[Erai-raws] Digimon Beatbreak - 47 [480p CR WEB-DL AVC AAC][48611D5C]',
    size: 0,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 1789275822000,
    state: 'leeching' as const,
    progress: 0,
  };

  const result = downloadClientItemSchema.parse(raw);
  expect(result.state).toBe('leeching');
  expect(result.progress).toBe(0);
});

test('downloadClientItemSchema rejects missing required fields', () => {
  expect(() => downloadClientItemSchema.parse({
    type: 'torrent',
    // missing id
    name: 'test',
    size: 100,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 0,
    state: 'unknown' as const,
    progress: 0,
  })).toThrow();
});

test('downloadClientItemSchema rejects invalid state', () => {
  expect(() => downloadClientItemSchema.parse({
    type: 'torrent',
    id: 'abc',
    name: 'test',
    size: 100,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 0,
    state: 'invalid-state' as any,
    progress: 0,
  })).toThrow();
});

test('downloadClientItemSchema rejects negative progress', () => {
  expect(() => downloadClientItemSchema.parse({
    type: 'torrent',
    id: 'abc',
    name: 'test',
    size: 100,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 0,
    state: 'unknown' as const,
    progress: -0.1,
  })).toThrow();
});

test('downloadClientItemSchema rejects progress > 1', () => {
  expect(() => downloadClientItemSchema.parse({
    type: 'torrent',
    id: 'abc',
    name: 'test',
    size: 100,
    sent: 0,
    downSpeed: 0,
    upSpeed: 0,
    time: 0,
    added: 0,
    state: 'unknown' as const,
    progress: 1.1,
  })).toThrow();
});

test('downloadClientStatusSchema parses status with rates', () => {
  const raw = {
    paused: false,
    rates: { down: 50000, up: 10000 },
    types: ['torrent'] as const,
  };

  const result = downloadClientStatusSchema.parse(raw);
  expect(result.paused).toBe(false);
  expect(result.rates.down).toBe(50000);
  expect(result.rates.up).toBe(10000);
  expect(result.types[0]).toBe('torrent');
});

test('downloadClientJobsAndStatusSchema parses full response', () => {
  const raw = {
    status: {
      paused: false,
      rates: { down: 50000, up: 10000 },
      types: ['torrent'] as const,
    },
    items: [
      {
        type: 'torrent' as const,
        id: 'abc123',
        name: 'Test Torrent',
        size: 1000000,
        sent: 500000,
        downSpeed: 1000,
        upSpeed: 500,
        time: 100,
        added: 1234567890,
        state: 'leeching' as const,
        progress: 0.5,
      },
    ],
  };

  const result = downloadClientJobsAndStatusSchema.parse(raw);
  expect(result.status.paused).toBe(false);
  expect(result.items).toHaveLength(1);
  expect(result.items[0]!.name).toBe('Test Torrent');
});
