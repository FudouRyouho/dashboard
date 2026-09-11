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
} as const satisfies Record<string, ExternalServiceDef>;

export type ExternalServiceKind = keyof typeof externalServiceDefs;
