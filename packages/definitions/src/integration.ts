import { IntegrationKind } from '@dashboard/contracts';
import { iconDataUris } from './icons.generated';

interface IntegrationDef {
  name: string;
  iconUrl: string;
}

export const integrationDefs = {
  sonarr: {
    name: 'Sonarr',
    iconUrl: iconDataUris.sonarr,
  }
} as const satisfies Record<IntegrationKind, IntegrationDef>;

export const getIconUrl = (kind: IntegrationKind): string =>
  integrationDefs[kind].iconUrl;

export const getIntegrationName = (kind: IntegrationKind): string =>
  integrationDefs[kind].name;
