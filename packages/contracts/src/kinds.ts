export const integrationKinds = ['sonarr', 'radarr', 'jellyfin'] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
