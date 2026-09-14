import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(result.id, raw.id);
  assert.equal(result.state, 'seeding');
  assert.equal(result.progress, 1);
  assert.equal(result.size, 1461514465);
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
  assert.equal(result.state, 'leeching');
  assert.equal(result.progress, 0);
});

test('downloadClientItemSchema rejects missing required fields', () => {
  assert.throws(() => {
    downloadClientItemSchema.parse({
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
    });
  });
});

test('downloadClientItemSchema rejects invalid state', () => {
  assert.throws(() => {
    downloadClientItemSchema.parse({
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
    });
  });
});

test('downloadClientItemSchema rejects negative progress', () => {
  assert.throws(() => {
    downloadClientItemSchema.parse({
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
    });
  });
});

test('downloadClientItemSchema rejects progress > 1', () => {
  assert.throws(() => {
    downloadClientItemSchema.parse({
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
    });
  });
});

test('downloadClientStatusSchema parses status with rates', () => {
  const raw = {
    paused: false,
    rates: { down: 50000, up: 10000 },
    types: ['torrent'] as const,
  };

  const result = downloadClientStatusSchema.parse(raw);
  assert.equal(result.paused, false);
  assert.equal(result.rates.down, 50000);
  assert.equal(result.rates.up, 10000);
  assert.equal(result.types[0], 'torrent');
});

test('downloadClientJobsAndStatusSchema parses full response', () => {
  const raw = {
    status: {
      paused: false,
      rates: { down: 50000, up: 10000 },
      types: ['torrent'],
    },
    items: [
      {
        type: 'torrent',
        id: 'abc123',
        name: 'Test Torrent',
        size: 1000000,
        sent: 500000,
        downSpeed: 5000,
        upSpeed: 1000,
        time: 60000,
        added: 1700000000000,
        state: 'leeching',
        progress: 0.5,
      },
    ],
  };

  const result = downloadClientJobsAndStatusSchema.parse(raw);
  assert.equal(result.items.length, 1);
  assert.equal(result.status.paused, false);
});
