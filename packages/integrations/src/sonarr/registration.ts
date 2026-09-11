import { SonarrIntegration } from './sonarr-integration';
import type {
  IntegrationInput,
  IntegrationFactory,
  IntegrationMetadata,
} from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'sonarr',
  defaultPort: 8989,
  displayName: 'Sonarr',
  description: 'Serie management and calendar',
  capabilities: ['calendar'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new SonarrIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);
