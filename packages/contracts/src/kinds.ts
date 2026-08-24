export const integrationKinds = ['sonarr'] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
