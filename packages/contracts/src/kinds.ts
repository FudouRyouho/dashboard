export const integrationKinds = [
  'sonarr',
  'radarr',
  'jellyfin',
  'docker',
] as const;
export type IntegrationKind = (typeof integrationKinds)[number];

export const externalServiceKinds = [
  'imdb',
  'theTvdb',
  'tmdb',
  'qbittorrent',
  'prowlarr',
  'prometheus',
  'portainer',
] as const;
export type ExternalServiceKind = (typeof externalServiceKinds)[number];
