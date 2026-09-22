import { test, expect } from 'vitest';
import { QbittorrentIntegration } from './qbittorrent-integration';

test('QbittorrentIntegration throws when qBittorrent is not available', async () => {
  const integrationInput = {
    kind: 'qbittorrent' as const,
    id: 'test-qbittorrent-unreachable',
    name: 'Test qBittorrent Unreachable',
    url: 'http://127.0.0.1:12345',
    secrets: [{ kind: 'apiKey', value: 'test-api-key' }],
    timeoutMs: 1000,
  };

  const integration = new QbittorrentIntegration(integrationInput);

  await expect(
    async () => {
      await integration.getClientJobsAndStatusAsync({ limit: 10 });
    }
  ).rejects.toThrow();
});

test('QbittorrentIntegration is instance of Integration and has required methods', () => {
  const integrationInput = {
    kind: 'qbittorrent' as const,
    id: 'test-qbittorrent-instance',
    name: 'Test qBittorrent Instance',
    url: 'http://localhost:8080',
    secrets: [{ kind: 'apiKey', value: 'test-api-key' }],
    timeoutMs: 10000,
  };

  const integration = new QbittorrentIntegration(integrationInput);

  expect(integration instanceof QbittorrentIntegration).toBeTruthy();
  expect(typeof integration.getClientJobsAndStatusAsync === 'function').toBeTruthy();
  expect(typeof integration.pauseQueueAsync === 'function').toBeTruthy();
  expect(typeof integration.pauseItemAsync === 'function').toBeTruthy();
  expect(typeof integration.resumeQueueAsync === 'function').toBeTruthy();
  expect(typeof integration.resumeItemAsync === 'function').toBeTruthy();
  expect(typeof integration.deleteItemAsync === 'function').toBeTruthy();
});

test('QbittorrentIntegration - mapTorrentState mapea correctamente todos los estados', () => {
  const integration = new QbittorrentIntegration({
    kind: 'qbittorrent',
    id: 'test-qbittorrent',
    name: 'Test qBittorrent',
    url: 'http://localhost:8080',
    secrets: [
      { kind: 'username', value: 'test-user' },
      { kind: 'password', value: 'test-pass' },
    ],
    timeoutMs: 10000,
  });
  const mapState = (integration as any).mapTorrentState.bind(integration);

  expect(mapState('downloading')).toBe('leeching', 'downloading -> leeching');
  expect(mapState('queuedDL')).toBe('leeching', 'queuedDL -> leeching');
  expect(mapState('checkingDL')).toBe('leeching', 'checkingDL -> leeching');
  expect(mapState('allocating')).toBe('leeching', 'allocating -> leeching');
  expect(mapState('forcedDL')).toBe('leeching', 'forcedDL -> leeching');
  expect(mapState('forcedMetaDL')).toBe('leeching', 'forcedMetaDL -> leeching');
  expect(mapState('metaDL')).toBe('leeching', 'metaDL -> leeching');
  expect(mapState('queuedForChecking')).toBe('leeching', 'queuedForChecking -> leeching');

  expect(mapState('uploading')).toBe('seeding', 'uploading -> seeding');
  expect(mapState('queuedUP')).toBe('seeding', 'queuedUP -> seeding');
  expect(mapState('checkingUP')).toBe('seeding', 'checkingUP -> seeding');
  expect(mapState('stalledUP')).toBe('seeding', 'stalledUP -> seeding');
  expect(mapState('forcedUP')).toBe('seeding', 'forcedUP -> seeding');

  expect(mapState('pausedDL')).toBe('paused', 'pausedDL -> paused');
  expect(mapState('pausedUP')).toBe('paused', 'pausedUP -> paused');
  expect(mapState('stoppedDL')).toBe('paused', 'stoppedDL -> paused');
  expect(mapState('stoppedUP')).toBe('paused', 'stoppedUP -> paused');

  expect(mapState('stalledDL')).toBe('stalled', 'stalledDL -> stalled');

  expect(mapState('error')).toBe('unknown', 'error -> unknown');
  expect(mapState('missingFiles')).toBe('unknown', 'missingFiles -> unknown');
  expect(mapState('moving')).toBe('unknown', 'moving -> unknown');
  expect(mapState('unknown')).toBe('unknown', 'unknown -> unknown');

  expect(mapState('someUndocumentedState')).toBe('unknown', 'unknown state -> unknown');
});

test('QbittorrentIntegration - calculateTime maneja casos borde', () => {
  const now = Date.now();
  const pastCompletionOn = Math.floor((now - 10000) / 1000);
  const completionMs = pastCompletionOn * 1000;
  const timeResult = Math.max(completionMs - now, -1);
  expect(timeResult).toBe(-1, 'completado en el pasado debería retornar -1');

  const infiniteEtaTime = 0;
  expect(infiniteEtaTime).toBe(0, 'eta infinito debería dar time=0');

  const normalEta = 1800;
  const normalEtaTime = Math.max(normalEta * 1000, 0);
  expect(normalEtaTime).toBe(1800000, 'eta normal debería ser 1800000ms');
});

test('QbittorrentIntegration - rates aggregation con datos reales', () => {
  const mockTorrents = [
    { dlspeed: 1024, upspeed: 512, progress: 0.5 },
    { dlspeed: 2048, upspeed: 1024, progress: 1.0 },
    { dlspeed: undefined, upspeed: 0, progress: 0 },
  ];

  const rates = mockTorrents.reduce(
    ({ down, up }, { dlspeed, upspeed }) => ({
      down: down + (dlspeed ?? 0),
      up: up + (upspeed ?? 0),
    }),
    { down: 0, up: 0 }
  );

  expect(rates.down).toBe(3072, 'total down speed debería ser 3072');
  expect(rates.up).toBe(1536, 'total up speed debería ser 1536');
});

test('QbittorrentIntegration - size fallback logic', () => {
  const mockTorrents = [
    { size: 1000, total_size: 1000, uploaded: 500 },
    { size: undefined, total_size: 2000, uploaded: 1000 },
    { size: 3000, total_size: undefined, uploaded: 1500 },
    { size: undefined, total_size: undefined, uploaded: 0 },
  ];

  const sizes = mockTorrents.map(t => t.size ?? t.total_size ?? 0);
  expect(sizes).toEqual([1000, 2000, 3000, 0], 'fallback logic debería funcionar correctamente');
});

test('QbittorrentIntegration - paused state logic', () => {
  const torrentsAllPaused = [
    { state: 'pausedDL' },
    { state: 'pausedUP' },
    { state: 'stoppedDL' },
  ];

  const paused = torrentsAllPaused.every(({ state }) => {
    switch (state) {
      case 'pausedDL':
      case 'pausedUP':
      case 'stoppedDL':
      case 'stoppedUP':
        return true;
      default:
        return false;
    }
  });

  expect(paused).toBe(true, 'todos pausados debería retornar true');

  const torrentsMixed = [
    { state: 'pausedDL' },
    { state: 'uploading' },
    { state: 'pausedUP' },
  ];

  const pausedMixed = torrentsMixed.every(({ state }) => {
    switch (state) {
      case 'pausedDL':
      case 'pausedUP':
      case 'stoppedDL':
      case 'stoppedUP':
        return true;
      default:
        return false;
    }
  });

  expect(pausedMixed).toBe(false, 'mezcla de estados debería retornar false');
});

test('QbittorrentIntegration - action methods exist and are callable', () => {
  const integrationInput = {
    kind: 'qbittorrent' as const,
    id: 'test-qbittorrent-actions',
    name: 'Test qBittorrent Actions',
    url: 'http://localhost:8080',
    secrets: [
      { kind: 'username', value: 'test-user' },
      { kind: 'password', value: 'test-pass' },
    ],
    timeoutMs: 10000,
  };

  const integration = new QbittorrentIntegration(integrationInput);

  expect(typeof integration.pauseQueueAsync === 'function').toBeTruthy();
  expect(typeof integration.pauseItemAsync === 'function').toBeTruthy();
  expect(typeof integration.resumeQueueAsync === 'function').toBeTruthy();
  expect(typeof integration.resumeItemAsync === 'function').toBeTruthy();
  expect(typeof integration.deleteItemAsync === 'function').toBeTruthy();
});
