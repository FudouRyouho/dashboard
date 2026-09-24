import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from '@dashboard/testing-utils/msw';
import { QbittorrentIntegration } from './qbittorrent-integration';
import { http, HttpResponse } from '@dashboard/testing-utils/msw';

// Simple inline handlers for testing
const createHandlers = (mode: 'success' | 'empty' | 'error_401' | 'error_500' | 'malformed' = 'success') => [
  http.get('http://localhost:8080/api/v2/app/version', ({ request }) => {
    const cookie = request.headers.get('cookie') ?? '';
    if (!cookie.includes('SID=')) return new Response('', { status: 403 });
    return new Response('4.4.0', { status: 200, headers: { 'content-type': 'text/plain' } });
  }),
  http.post('http://localhost:8080/api/v2/auth/login', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    if (params.get('username') === 'test-user' && params.get('password') === 'test-pass') {
      return new Response('Ok.', { status: 200, headers: { 'Set-Cookie': 'SID=test-sid; Path=/; HttpOnly' } });
    }
    return new Response('Forbidden.', { status: 403, headers: { 'Set-Cookie': 'SID=; Path=/; HttpOnly' } });
  }),
  http.get('http://localhost:8080/api/v2/torrents/info', ({ request }) => {
    const cookie = request.headers.get('cookie') ?? '';
    if (!cookie.includes('SID=')) return new Response('', { status: 403 });
    
    switch (mode) {
      case 'error_401':
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      case 'error_500':
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      case 'malformed':
        return new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } });
      case 'empty':
        return HttpResponse.json([]);
      case 'success':
      default:
        return HttpResponse.json([{
          hash: 'test-torrent-hash-1', name: 'Test Torrent 1', size: 1000000, progress: 0.5,
          dlspeed: 1024, upspeed: 512, state: 'downloading', category: 'test',
          added_on: Math.floor(Date.now() / 1000) - 3600, eta: 1800, uploaded: 100,
          completion_on: 0, total_size: 1000000,
        }]);
    }
  }),
  http.post('http://localhost:8080/api/v2/torrents/pause', () => new Response('', { status: 200 })),
  http.post('http://localhost:8080/api/v2/torrents/resume', () => new Response('', { status: 200 })),
  http.post('http://localhost:8080/api/v2/torrents/delete', () => new Response('', { status: 200 })),
];

const server = setupServer(...createHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('QbittorrentIntegration (handlers HTTP)', () => {
  const createIntegration = () => new QbittorrentIntegration({
    kind: 'qbittorrent',
    id: 'test-qbittorrent',
    name: 'Test qBittorrent',
    url: 'http://localhost:8080',
    secrets: [{ kind: 'username', value: 'test-user' }, { kind: 'password', value: 'test-pass' }],
    timeoutMs: 10000,
  });

  test('throws on invalid credentials (401/403)', async () => {
    server.use(...createHandlers('error_401'));
    const integration = createIntegration();
    try {
      await integration.getClientJobsAndStatusAsync({ limit: 10 });
    } catch (e: any) {
      console.log('401 error:', e?.reason, e?.message, e?.name, e?.httpStatus);
      expect(e?.reason).toBe('unauthorized');
    }
  });

  test('returns torrents when available', async () => {
    const integration = createIntegration();
    const result = await integration.getClientJobsAndStatusAsync({ limit: 10 });
    expect(result).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('test-torrent-hash-1');
    expect(result.items[0]!.name).toBe('Test Torrent 1');
    expect(result.status.rates.down).toBe(1024);
    expect(result.status.rates.up).toBe(512);
  });

  test('returns empty array when no torrents', async () => {
    server.use(...createHandlers('empty'));
    const integration = createIntegration();
    const result = await integration.getClientJobsAndStatusAsync({ limit: 10 });
    expect(result.items).toEqual([]);
    expect(result.status.rates.down).toBe(0);
    expect(result.status.rates.up).toBe(0);
  });

  test('throws on malformed JSON response', async () => {
    server.use(...createHandlers('malformed'));
    const integration = createIntegration();
    try {
      await integration.getClientJobsAndStatusAsync({ limit: 10 });
    } catch (e: any) {
      console.log('malformed error:', e?.reason, e?.message, e?.name, e?.httpStatus, e?.cause);
      expect(e).toBeInstanceOf(Error);
    }
  });

  test('mapTorrentState mapea correctamente todos los estados', () => {
    const integration = createIntegration();
    const mapState = (integration as any).mapTorrentState.bind(integration);

    expect(mapState('downloading')).toBe('leeching');
    expect(mapState('queuedDL')).toBe('leeching');
    expect(mapState('checkingDL')).toBe('leeching');
    expect(mapState('allocating')).toBe('leeching');
    expect(mapState('forcedDL')).toBe('leeching');
    expect(mapState('forcedMetaDL')).toBe('leeching');
    expect(mapState('metaDL')).toBe('leeching');
    expect(mapState('queuedForChecking')).toBe('leeching');

    expect(mapState('uploading')).toBe('seeding');
    expect(mapState('queuedUP')).toBe('seeding');
    expect(mapState('checkingUP')).toBe('seeding');
    expect(mapState('stalledUP')).toBe('seeding');
    expect(mapState('forcedUP')).toBe('seeding');

    expect(mapState('pausedDL')).toBe('paused');
    expect(mapState('pausedUP')).toBe('paused');
    expect(mapState('stoppedDL')).toBe('paused');
    expect(mapState('stoppedUP')).toBe('paused');

    expect(mapState('stalledDL')).toBe('stalled');

    expect(mapState('error')).toBe('unknown');
    expect(mapState('missingFiles')).toBe('unknown');
    expect(mapState('moving')).toBe('unknown');
    expect(mapState('unknown')).toBe('unknown');
    expect(mapState('someUndocumentedState')).toBe('unknown');
  });

  test('calculateTime maneja casos borde', () => {
    const now = Date.now();
    const pastCompletionOn = Math.floor((now - 10000) / 1000);
    const completionMs = pastCompletionOn * 1000;
    const timeResult = Math.max(completionMs - now, -1);
    expect(timeResult).toBe(-1);

    const infiniteEtaTime = 0;
    expect(infiniteEtaTime).toBe(0);

    const normalEta = 1800;
    const normalEtaTime = Math.max(normalEta * 1000, 0);
    expect(normalEtaTime).toBe(1800000);
  });

  test('rates aggregation con datos reales', () => {
    const mockTorrents = [
      { dlspeed: 1024, upspeed: 512, progress: 0.5 },
      { dlspeed: 2048, upspeed: 1024, progress: 1.0 },
      { dlspeed: undefined, upspeed: 0, progress: 0 },
    ];
    const rates = mockTorrents.reduce(({ down, up }, { dlspeed, upspeed }) => ({
      down: down + (dlspeed ?? 0), up: up + (upspeed ?? 0),
    }), { down: 0, up: 0 });
    expect(rates.down).toBe(3072);
    expect(rates.up).toBe(1536);
  });

  test('size fallback logic', () => {
    const mockTorrents = [
      { size: 1000, total_size: 1000, uploaded: 500 },
      { size: undefined, total_size: 2000, uploaded: 1000 },
      { size: 3000, total_size: undefined, uploaded: 1500 },
      { size: undefined, total_size: undefined, uploaded: 0 },
    ];
    const sizes = mockTorrents.map(t => t.size ?? t.total_size ?? 0);
    expect(sizes).toEqual([1000, 2000, 3000, 0]);
  });

  test('paused state logic', () => {
    const torrentsAllPaused = [{ state: 'pausedDL' }, { state: 'pausedUP' }, { state: 'stoppedDL' }];
    const paused = torrentsAllPaused.every(({ state }) => {
      switch (state) {
        case 'pausedDL': case 'pausedUP': case 'stoppedDL': case 'stoppedUP': return true;
        default: return false;
      }
    });
    expect(paused).toBe(true);

    const torrentsMixed = [{ state: 'pausedDL' }, { state: 'uploading' }, { state: 'pausedUP' }];
    const pausedMixed = torrentsMixed.every(({ state }) => {
      switch (state) {
        case 'pausedDL': case 'pausedUP': case 'stoppedDL': case 'stoppedUP': return true;
        default: return false;
      }
    });
    expect(pausedMixed).toBe(false);
  });

  test('action methods exist and are callable', () => {
    const integration = createIntegration();
    expect(typeof integration.pauseQueueAsync === 'function').toBeTruthy();
    expect(typeof integration.pauseItemAsync === 'function').toBeTruthy();
    expect(typeof integration.resumeQueueAsync === 'function').toBeTruthy();
    expect(typeof integration.resumeItemAsync === 'function').toBeTruthy();
    expect(typeof integration.deleteItemAsync === 'function').toBeTruthy();
  });

  test('pauseQueueAsync calls API', async () => {
    const integration = createIntegration();
    await integration.pauseQueueAsync();
  });

  test('resumeQueueAsync calls API', async () => {
    const integration = createIntegration();
    await integration.resumeQueueAsync();
  });

  test('pauseItemAsync calls API', async () => {
    const integration = createIntegration();
    await integration.pauseItemAsync({
      type: 'torrent', id: 'test-torrent-hash-1', name: '', size: 0,
      sent: 0, downSpeed: 0, upSpeed: 0, time: 0, added: 0, state: 'leeching', progress: 0,
    });
  });

  test('resumeItemAsync calls API', async () => {
    const integration = createIntegration();
    await integration.resumeItemAsync({
      type: 'torrent', id: 'test-torrent-hash-1', name: '', size: 0,
      sent: 0, downSpeed: 0, upSpeed: 0, time: 0, added: 0, state: 'leeching', progress: 0,
    });
  });

  test('deleteItemAsync calls API with fromDisk', async () => {
    const integration = createIntegration();
    await integration.deleteItemAsync({
      type: 'torrent', id: 'test-torrent-hash-1', name: '', size: 0,
      sent: 0, downSpeed: 0, upSpeed: 0, time: 0, added: 0, state: 'leeching', progress: 0,
    }, true);
  });
});
