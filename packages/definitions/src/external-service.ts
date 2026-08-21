import { iconDataUris } from './icons.generated';

interface ExternalServiceDef {
  name: string;
  iconUrl: string;
  color?: string;
  isDark: boolean;
}

export const externalServiceDefs = {
  imdb: {
    name: 'IMDb',
    iconUrl: iconDataUris.imdb,
    color: '#f5c518',
    isDark: false,
  },
  theTvdb: {
    name: 'TheTVDB',
    iconUrl: iconDataUris['the-tvdb'],
    color: '#293a36',
    isDark: true,
  },
  tmdb: {
    name: 'TMDB',
    iconUrl: iconDataUris.tmdb,
    color: '#032541',
    isDark: false,
  },
} as const satisfies Record<string, ExternalServiceDef>;

export type ExternalServiceKind = keyof typeof externalServiceDefs;

export const getExternalServiceIconUrl = (kind: ExternalServiceKind): string =>
  externalServiceDefs[kind].iconUrl;
