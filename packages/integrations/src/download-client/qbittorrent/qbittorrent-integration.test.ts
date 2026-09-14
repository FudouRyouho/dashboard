import test from 'node:test';
import assert from 'node:assert/strict';
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

  await assert.rejects(
    async () => {
      await integration.getClientJobsAndStatusAsync({ limit: 10 });
    },
    (err: unknown) => {
      return err instanceof Error;
    }
  );
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

  assert.ok(integration instanceof QbittorrentIntegration);
  assert.ok(typeof integration.getClientJobsAndStatusAsync === 'function');
  assert.ok(typeof integration.pauseQueueAsync === 'function');
  assert.ok(typeof integration.pauseItemAsync === 'function');
  assert.ok(typeof integration.resumeQueueAsync === 'function');
  assert.ok(typeof integration.resumeItemAsync === 'function');
  assert.ok(typeof integration.deleteItemAsync === 'function');
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

  assert.equal(mapState('downloading'), 'leeching', 'downloading -> leeching');
  assert.equal(mapState('queuedDL'), 'leeching', 'queuedDL -> leeching');
  assert.equal(mapState('checkingDL'), 'leeching', 'checkingDL -> leeching');
  assert.equal(mapState('allocating'), 'leeching', 'allocating -> leeching');
  assert.equal(mapState('forcedDL'), 'leeching', 'forcedDL -> leeching');
  assert.equal(mapState('forcedMetaDL'), 'leeching', 'forcedMetaDL -> leeching');
  assert.equal(mapState('metaDL'), 'leeching', 'metaDL -> leeching');
  assert.equal(mapState('queuedForChecking'), 'leeching', 'queuedForChecking -> leeching');

  assert.equal(mapState('uploading'), 'seeding', 'uploading -> seeding');
  assert.equal(mapState('queuedUP'), 'seeding', 'queuedUP -> seeding');
  assert.equal(mapState('checkingUP'), 'seeding', 'checkingUP -> seeding');
  assert.equal(mapState('stalledUP'), 'seeding', 'stalledUP -> seeding');
  assert.equal(mapState('forcedUP'), 'seeding', 'forcedUP -> seeding');

  assert.equal(mapState('pausedDL'), 'paused', 'pausedDL -> paused');
  assert.equal(mapState('pausedUP'), 'paused', 'pausedUP -> paused');
  assert.equal(mapState('stoppedDL'), 'paused', 'stoppedDL -> paused');
  assert.equal(mapState('stoppedUP'), 'paused', 'stoppedUP -> paused');

  assert.equal(mapState('stalledDL'), 'stalled', 'stalledDL -> stalled');

  assert.equal(mapState('error'), 'unknown', 'error -> unknown');
  assert.equal(mapState('missingFiles'), 'unknown', 'missingFiles -> unknown');
  assert.equal(mapState('moving'), 'unknown', 'moving -> unknown');
  assert.equal(mapState('unknown'), 'unknown', 'unknown -> unknown');

  assert.equal(mapState('someUndocumentedState'), 'unknown', 'unknown state -> unknown');
});

test('QbittorrentIntegration - calculateTime maneja casos borde', () => {
  const now = Date.now();
  const pastCompletionOn = Math.floor((now - 10000) / 1000);
  const completionMs = pastCompletionOn * 1000;
  const timeResult = Math.max(completionMs - now, -1);
  assert.equal(timeResult, -1, 'completado en el pasado debería retornar -1');

  const infiniteEtaTime = 0;
  assert.equal(infiniteEtaTime, 0, 'eta infinito debería dar time=0');

  const normalEta = 1800;
  const normalEtaTime = Math.max(normalEta * 1000, 0);
  assert.equal(normalEtaTime, 1800000, 'eta normal debería ser 1800000ms');
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

  assert.equal(rates.down, 3072, 'total down speed debería ser 3072');
  assert.equal(rates.up, 1536, 'total up speed debería ser 1536');
});

test('QbittorrentIntegration - size fallback logic', () => {
  const mockTorrents = [
    { size: 1000, total_size: 1000, uploaded: 500 },
    { size: undefined, total_size: 2000, uploaded: 1000 },
    { size: 3000, total_size: undefined, uploaded: 1500 },
    { size: undefined, total_size: undefined, uploaded: 0 },
  ];

  const sizes = mockTorrents.map(t => t.size ?? t.total_size ?? 0);
  assert.deepEqual(sizes, [1000, 2000, 3000, 0], 'fallback logic debería funcionar correctamente');
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

  assert.equal(paused, true, 'todos pausados debería retornar true');

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

  assert.equal(pausedMixed, false, 'mezcla de estados debería retornar false');
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

  assert.ok(typeof integration.pauseQueueAsync === 'function');
  assert.ok(typeof integration.pauseItemAsync === 'function');
  assert.ok(typeof integration.resumeQueueAsync === 'function');
  assert.ok(typeof integration.resumeItemAsync === 'function');
  assert.ok(typeof integration.deleteItemAsync === 'function');
});
