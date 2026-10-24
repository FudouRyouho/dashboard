import { IntegrationKind } from '@dashboard/contracts';

interface IntegrationDef {
  name: string;
  iconUrl: string;
  /** Brand color as hex, extracted from the icon in ../icons/. Framework-agnostic. */
  color: string;
  /** True when `color` is dark (white text on top); false when light. */
  isDark: boolean;
}

export const integrationDefs = {
  sonarr: {
    name: 'Sonarr',
    iconUrl: '/icons/sonarr.svg',
    color: '#00ccff',
    isDark: false,
  },
  radarr: {
    name: 'Radarr',
    iconUrl: '/icons/radarr.svg',
    color: '#ffc230',
    isDark: false,
  },
  jellyfin: {
    name: 'Jellyfin',
    iconUrl: '/icons/jellyfin.svg',
    color: '#aa5cc3',
    isDark: true,
  },
  docker: {
    name: 'Docker',
    iconUrl: '/icons/docker.svg',
    color: '#2496ed',
    isDark: true,
  },
  prometheus: {
    name: 'Prometheus',
    iconUrl: '/icons/prometheus.svg',
    color: '#e6522c',
    isDark: true,
  },
  qbittorrent: {
    name: 'qBittorrent',
    iconUrl: '/icons/qbittorrent.svg',
    color: '#72b4f5',
    isDark: false,
  },
  prowlarr: {
    name: 'Prowlarr',
    iconUrl: '/icons/prowlarr.svg',
    color: '#d4541e',
    isDark: true,
  },
} as const satisfies Record<IntegrationKind, IntegrationDef>;
