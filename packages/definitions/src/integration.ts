import { IntegrationKind } from '@dashboard/contracts';

interface IntegrationDef {
  name: string;
  iconUrl: string;
}

export const integrationDefs = {
  sonarr: {
    name: 'Sonarr',
    iconUrl: '/icons/sonarr.svg',
  },
  radarr: {
    name: 'Radarr',
    iconUrl: '/icons/radarr.svg',
  },
  jellyfin: {
    name: 'Jellyfin',
    iconUrl: '/icons/jellyfin.svg',
  },
  docker: {
    name: 'Docker',
    iconUrl: '/icons/docker.svg',
  },
  prometheus: {
    name: 'Prometheus',
    iconUrl: '/icons/prometheus.svg',
  },
  qbittorrent: {
    name: 'qBittorrent',
    iconUrl: '/icons/qbittorrent.svg',
  },
} as const satisfies Record<IntegrationKind, IntegrationDef>;
