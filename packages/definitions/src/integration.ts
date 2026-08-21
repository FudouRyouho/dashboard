import { iconDataUris } from './icons.generated';

interface IntegrationDef {
  name: string;
  iconUrl: string;
}

export const integrationDefs = {
  sonarr: {
    name: 'Sonarr',
    iconUrl: iconDataUris.sonarr,
  },
} as const satisfies Record<string, IntegrationDef>;

export type IntegrationKind = keyof typeof integrationDefs;

export const integrationKinds = Object.keys(integrationDefs) as [
  IntegrationKind,
  ...IntegrationKind[],
];

export const getIconUrl = (kind: IntegrationKind): string =>
  integrationDefs[kind].iconUrl;

export const getIntegrationName = (kind: IntegrationKind): string =>
  integrationDefs[kind].name;
