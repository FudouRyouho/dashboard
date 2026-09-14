export const integrationKinds = [
  'sonarr',
  'radarr',
  'jellyfin',
  'docker',
  'prometheus',
  'qbittorrent',
] as const;
export type IntegrationKind = (typeof integrationKinds)[number];

export const externalServiceKinds = [
  'imdb',
  'theTvdb',
  'tmdb',
  'prowlarr',
  'portainer',
] as const;
export type ExternalServiceKind = (typeof externalServiceKinds)[number];
