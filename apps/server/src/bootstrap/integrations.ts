import type { Integration } from '@dashboard/integrations';
import { SonarrIntegration } from '@dashboard/integrations';
import type { Config } from '../config';

export const createIntegrationRegistry = (appConfig: Config): Integration[] =>
  appConfig.integrations.map((integration) => {
    switch (integration.kind) {
      case 'sonarr': {
        const { apiKey, ...rest } = integration;
        return new SonarrIntegration({
          ...rest,
          secrets: [{ kind: 'apiKey', value: apiKey }],
        });
      }
    }
  });
