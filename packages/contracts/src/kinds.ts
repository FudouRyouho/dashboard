export const integrationKinds = [
  'sonarr',
  'radarr',
  'jellyfin',
  'docker',
  'prometheus',
] as const;
export type IntegrationKind = (typeof integrationKinds)[number];

export const externalServiceKinds = [
  'imdb',
  'theTvdb',
  'tmdb',
  'qbittorrent',
  'prowlarr',
  'portainer',
] as const;
export type ExternalServiceKind = (typeof externalServiceKinds)[number];
