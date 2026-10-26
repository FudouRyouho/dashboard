import { integrationOutputSchema, type IntegrationOutput } from '@dashboard/contracts';

/**
 * Mock for `integrations.list` — shape matches `integrationOutputSchema`
 * exactly (packages/contracts/src/integrations.ts:82-91). The server NEVER
 * returns secrets, so neither does this mock. There is no `status` field in
 * the contract (the test-connection procedure does not exist yet), so the
 * previous fake `status` is gone: the UI must not pretend to know it.
 */
export type { IntegrationOutput };

export const integrationsMock: IntegrationOutput[] = [
  {
    id: 'sonarr-main',
    kind: 'sonarr',
    name: 'Sonarr (Series)',
    url: 'http://192.168.10.197',
    externalUrl: null,
    port: 8989,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  },
  {
    id: 'radarr-main',
    kind: 'radarr',
    name: 'Radarr (Películas)',
    url: 'http://192.168.10.197',
    externalUrl: null,
    port: 7878,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  },
  {
    id: 'prowlarr-main',
    kind: 'prowlarr',
    name: 'Prowlarr (Indexadores)',
    url: 'http://192.168.10.197',
    externalUrl: null,
    port: 9696,
    createdAt: new Date('2026-09-05T14:00:00.000Z'),
    updatedAt: new Date('2026-10-18T23:00:00.000Z'),
  },
  {
    id: 'qbittorrent-main',
    kind: 'qbittorrent',
    name: 'qBittorrent (Descargas)',
    url: 'http://192.168.10.197',
    externalUrl: null,
    port: 8080,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  },
  {
    id: 'jellyfin-main',
    kind: 'jellyfin',
    name: 'Jellyfin (Media Server)',
    url: 'http://192.168.10.125',
    externalUrl: 'http://192.168.10.125:8096/web/',
    port: 8096,
    createdAt: new Date('2026-09-02T11:00:00.000Z'),
    updatedAt: new Date('2026-10-10T09:00:00.000Z'),
  },
  {
    id: 'docker-server-197',
    kind: 'docker',
    name: 'Docker Servidor (197)',
    url: 'http://192.168.10.197',
    externalUrl: null,
    port: 2375,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  },
  {
    id: 'prometheus-main',
    kind: 'prometheus',
    name: 'Prometheus Metrics',
    url: 'http://192.168.10.197',
    externalUrl: 'http://192.168.10.197:9090/graph',
    port: 9090,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T12:00:00.000Z'),
  },
];

/**
 * Dev-only guard: the mock is parsed against the real contract schema so the
 * section cannot silently diverge from `integrations.list`. The client has no
 * test runner (no `vitest`/`jest` script in package.json), so this runs as a
 * runtime assertion rather than a unit test.
 */
export function assertIntegrationsMockValid(): void {
  integrationOutputSchema.array().parse(integrationsMock);
}