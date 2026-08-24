export const integrationKinds = ['sonarr', 'radarr'] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
