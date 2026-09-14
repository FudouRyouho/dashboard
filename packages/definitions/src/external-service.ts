import type { ExternalServiceKind } from '@dashboard/contracts';

interface ExternalServiceDef {
  name: string;
  iconUrl: string;
  color?: string;
  isDark: boolean;
}

export const externalServiceDefs = {
  imdb: {
    name: 'IMDb',
    iconUrl: '/icons/imdb.svg',
    color: '#f5c518',
    isDark: false,
  },
  theTvdb: {
    name: 'TheTVDB',
    iconUrl: '/icons/the-tvdb.svg',
    color: '#293a36',
    isDark: true,
  },
  tmdb: {
    name: 'TMDB',
    iconUrl: '/icons/tmdb.svg',
    color: '#032541',
    isDark: false,
  },
  prowlarr: {
    name: 'Prowlarr',
    iconUrl: '/icons/prowlarr.svg',
    color: '#ff6b35',
    isDark: false,
  },
  portainer: {
    name: 'Portainer',
    iconUrl: '/icons/portainer.svg',
    color: '#1993d8',
    isDark: false,
  },
} as const satisfies Record<ExternalServiceKind, ExternalServiceDef>;

export { type ExternalServiceKind } from '@dashboard/contracts';
