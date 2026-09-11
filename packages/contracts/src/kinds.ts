export const integrationKinds = [
  'sonarr',
  'radarr',
  'jellyfin',
  'docker',
] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
