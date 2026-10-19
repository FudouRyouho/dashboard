import type { IntegrationKind } from '@dashboard/contracts';

export interface IntegrationConfigMock {
  id: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  port?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export const integrationsMock: IntegrationConfigMock[] = [
  {
    id: 'sonarr-main',
    kind: 'sonarr',
    name: 'Sonarr (Series)',
    url: 'http://192.168.10.197',
    port: 8989,
    apiKey: '1b69876fabd54fad8a796046009f9dc2',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'radarr-main',
    kind: 'radarr',
    name: 'Radarr (Películas)',
    url: 'http://192.168.10.197',
    port: 7878,
    apiKey: 'f2e083f421ac41859b7797a0a1b181b1',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'prowlarr-main',
    kind: 'prowlarr',
    name: 'Prowlarr (Indexadores)',
    url: 'http://192.168.10.197',
    port: 9696,
    apiKey: 'c0b8853885b143f59dce08036e367abe',
    createdAt: '2026-09-05T14:00:00.000Z',
    updatedAt: '2026-10-18T23:00:00.000Z',
  },
  {
    id: 'qbittorrent-main',
    kind: 'qbittorrent',
    name: 'qBittorrent (Descargas)',
    url: 'http://192.168.10.197',
    port: 8080,
    username: 'FudouRyouho',
    password: 'NOloliNOlife',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'jellyfin-main',
    kind: 'jellyfin',
    name: 'Jellyfin (Media Server)',
    url: 'http://192.168.10.125',
    port: 8096,
    apiKey: 'f4faf35855b340f4b6378ecea12df42a',
    createdAt: '2026-09-02T11:00:00.000Z',
    updatedAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'docker-server-197',
    kind: 'docker',
    name: 'Docker Servidor (197)',
    url: 'http://192.168.10.197',
    port: 2375,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'docker-local-125',
    kind: 'docker',
    name: 'Docker Local (125)',
    url: 'http://192.168.10.125',
    port: 2375,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'prometheus-main',
    kind: 'prometheus',
    name: 'Prometheus Metrics',
    url: 'http://192.168.10.197',
    port: 9090,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
];
