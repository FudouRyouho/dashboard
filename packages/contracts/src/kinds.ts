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

/**
 * Capabilities that integrations can support.
 * Used for task IDs, config keys, and capability validation.
 */
export const integrationCapabilities = [
  'calendar',
  'media-releases',
  'docker',
  'downloads',
  'system-health',
] as const;
export type IntegrationCapability = (typeof integrationCapabilities)[number];
