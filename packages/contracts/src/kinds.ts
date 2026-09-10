export const integrationKinds = ['sonarr', 'radarr', 'jellyfin', 'portainer'] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
