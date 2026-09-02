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
  },
  radarr: {
    name: 'Radarr',
    iconUrl: iconDataUris.radarr,
  },
  jellyfin: {
    name: 'Jellyfin',
    iconUrl: iconDataUris.jellyfin,
  },
} as const satisfies Record<IntegrationKind, IntegrationDef>;
