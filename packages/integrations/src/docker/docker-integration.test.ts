import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer, dockerHandlers, http, HttpResponse } from '@dashboard/testing-utils/msw';
import { DockerIntegration } from './docker-integration';
import type { DockerContainerLogOptions } from '@dashboard/integrations';

const DOCKER_URL = 'http://127.0.0.1';
const DOCKER_PORT = 2375;
const BASE = `${DOCKER_URL}:${DOCKER_PORT}`;

function makeIntegration() {
  return new DockerIntegration({
    kind: 'docker',
    id: 'test-docker',
    name: 'Test Docker',
    url: DOCKER_URL,
    port: DOCKER_PORT,
    secrets: [],
    timeoutMs: 5000,
  });
}

/** Build a Docker multiplexed log frame (8-byte header + payload). */
function dockerFrame(streamType: 1 | 2, text: string): Uint8Array {
  const encoder = new TextEncoder();
  const payload = encoder.encode(text);
  const frame = new Uint8Array(8 + payload.length);
  frame[0] = streamType;
  // bytes 1-3 reserved (zero)
  new DataView(frame.buffer).setUint32(4, payload.length, false); // big-endian size
  frame.set(payload, 8);
  return frame;
}

/** Concatenate multiple frames into one buffer. */
function concatFrames(...frames: Uint8Array[]): Uint8Array {
  const total = frames.reduce((n, f) => n + f.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const f of frames) {
    out.set(f, offset);
    offset += f.length;
  }
  return out;
}

describe('DockerIntegration', () => {
  const server = setupServer(
    ...dockerHandlers({
      id: 'test-docker',
      url: DOCKER_URL,
      port: DOCKER_PORT,
    }),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('getDashboardStatsAsync', () => {
    test('aggregates containers, images, networks and volumes', async () => {
      server.use(
        http.get(`${BASE}/containers/json`, () =>
          HttpResponse.json([
            { Id: 'c1', Names: ['/a'], Image: 'nginx', State: 'running', Status: 'Up 1h', Health: { Status: 'healthy' } },
            { Id: 'c2', Names: ['/b'], Image: 'redis', State: 'running', Status: 'Up 2h' },
            { Id: 'c3', Names: ['/c'], Image: 'busybox', State: 'exited', Status: 'Exited (0)' },
          ]),
        ),
        http.get(`${BASE}/images/json`, () =>
          HttpResponse.json([{ Size: 1000 }, { Size: 2000 }]),
        ),
        http.get(`${BASE}/networks`, () =>
          HttpResponse.json([
            { Name: 'bridge', Id: 'n1', Scope: 'local', Driver: 'bridge' },
            { Name: 'host', Id: 'n2', Scope: 'local', Driver: 'host' },
            { Name: 'custom-net', Id: 'n3', Scope: 'local', Driver: 'bridge' },
          ]),
        ),
        http.get(`${BASE}/volumes`, () =>
          HttpResponse.json({ Volumes: [{ Name: 'v1' }, { Name: 'v2' }] }),
        ),
      );

      const stats = await makeIntegration().getDashboardStatsAsync();

      expect(stats.containers).toEqual({ running: 2, stopped: 1, healthy: 1, unhealthy: 0, total: 3 });
      expect(stats.images).toEqual({ total: 2, size: 3000 });
      // bridge/host/none are excluded from the custom-network count
      expect(stats.networks.total).toBe(1);
      expect(stats.volumes.total).toBe(2);
    });

    test('returns zero-filled stats when every endpoint fails', async () => {
      server.use(
        http.get(`${BASE}/containers/json`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${BASE}/images/json`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${BASE}/networks`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${BASE}/volumes`, () => new HttpResponse(null, { status: 500 })),
      );

      const stats = await makeIntegration().getDashboardStatsAsync();

      expect(stats.containers.running).toBe(0);
      expect(stats.containers.stopped).toBe(0);
      expect(stats.containers.total).toBe(0);
      expect(stats.images.total).toBe(0);
      expect(stats.images.size).toBe(0);
      expect(stats.networks.total).toBe(0);
      expect(stats.volumes.total).toBe(0);
    });
  });

  describe('container actions', () => {
    test('start / stop / restart POST to the correct endpoints', async () => {
      const integration = makeIntegration();
      await integration.startContainerAsync('c1');
      await integration.stopContainerAsync('c1');
      await integration.restartContainerAsync('c1');
      // No throw means each handler matched (onUnhandledRequest: 'error').
    });

    test('remove DELETEs the container', async () => {
      await makeIntegration().removeContainerAsync('c1');
    });
  });

  describe('getContainersAsync', () => {
    test('returns the raw container list from /containers/json?all=true', async () => {
      server.use(
        http.get(`${BASE}/containers/json`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('all')).toBe('true');
          return HttpResponse.json([
            { Id: 'abc123', Names: ['/test-container'], Image: 'nginx:latest', Created: 1, State: 'running', Status: 'Up 2 hours', Health: { Status: 'healthy' } },
          ]);
        }),
      );

      const containers = await makeIntegration().getContainersAsync();
      expect(containers).toHaveLength(1);
      expect(containers[0]?.Id).toBe('abc123');
      expect(containers[0]?.State).toBe('running');
    });
  });

  describe('getSystemStatsAsync', () => {
    test('returns /info payload', async () => {
      server.use(
        http.get(`${BASE}/info`, () =>
          HttpResponse.json({
            Containers: 10,
            ContainersRunning: 5,
            ContainersPaused: 0,
            ContainersStopped: 2,
            Images: 20,
            NCPU: 4,
            MemTotal: 8 * 1024 * 1024 * 1024,
          }),
        ),
      );

      const info = await makeIntegration().getSystemStatsAsync();
      expect(info.Containers).toBe(10);
      expect(info.ContainersRunning).toBe(5);
      expect(info.NCPU).toBe(4);
      expect(info.MemTotal).toBe(8 * 1024 * 1024 * 1024);
    });
  });

  describe('getContainerStatsAsync', () => {
    test('requests non-streaming stats and returns the payload', async () => {
      server.use(
        http.get(`${BASE}/containers/c1/stats`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('stream')).toBe('false');
          return HttpResponse.json({
            id: 'c1',
            name: '/test-container',
            read: '2026-01-01T00:00:00Z',
            cpu_stats: { cpu_usage: { total_usage: 1_000_000 } },
            memory_stats: { usage: 1024 * 1024 * 100 },
          });
        }),
      );

      const stats = await makeIntegration().getContainerStatsAsync('c1');
      expect(stats.id).toBe('c1');
      expect(stats.cpu_stats?.cpu_usage.total_usage).toBe(1_000_000);
      expect(stats.memory_stats?.usage).toBe(1024 * 1024 * 100);
    });
  });

  describe('getContainerLogsAsync', () => {
    test('parses multiplexed stdout/stderr frames into trimmed lines', async () => {
      server.use(
        http.get(`${BASE}/containers/c1/logs`, () => {
          const body = concatFrames(
            dockerFrame(1, 'Application started\n'),
            dockerFrame(2, 'warning: disk almost full\n'),
            dockerFrame(1, 'ready\n'),
          );
          return new HttpResponse(body, {
            status: 200,
            headers: { 'content-type': 'application/vnd.docker.raw-stream' },
          });
        }),
      );

      const logs = await makeIntegration().getContainerLogsAsync('c1');
      expect(logs).toEqual(['Application started', 'warning: disk almost full', 'ready']);
    });

    test('passes tail/stdout/stderr/timestamps query params through', async () => {
      server.use(
        http.get(`${BASE}/containers/c1/logs`, ({ request }) => {
          const p = new URL(request.url).searchParams;
          expect(p.get('tail')).toBe('50');
          expect(p.get('stdout')).toBe('true');
          expect(p.get('stderr')).toBe('false');
          expect(p.get('timestamps')).toBe('true');
          expect(p.get('follow')).toBe('false');
          return new HttpResponse(concatFrames(dockerFrame(1, 'ok')), { status: 200 });
        }),
      );

      const options: DockerContainerLogOptions = {
        stdout: true,
        stderr: false,
        tail: 50,
        timestamps: true,
        follow: false,
      };
      const logs = await makeIntegration().getContainerLogsAsync('c1', options);
      expect(logs).toEqual(['ok']);
    });

    test("serializes tail='all'", async () => {
      server.use(
        http.get(`${BASE}/containers/c1/logs`, ({ request }) => {
          expect(new URL(request.url).searchParams.get('tail')).toBe('all');
          return new HttpResponse(new Uint8Array(), { status: 200 });
        }),
      );

      const logs = await makeIntegration().getContainerLogsAsync('c1', { tail: 'all' } as Partial<DockerContainerLogOptions> as DockerContainerLogOptions);
      expect(logs).toEqual([]);
    });

    test('throws IntegrationError on a failed response', async () => {
      server.use(
        http.get(`${BASE}/containers/c1/logs`, () => new HttpResponse(null, { status: 404 })),
      );

      await expect(makeIntegration().getContainerLogsAsync('c1')).rejects.toThrow();
    });
  });
});