import { RadarrIntegration } from './radarr-integration';
import type {
  IntegrationInput,
  IntegrationFactory,
  IntegrationMetadata,
} from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'radarr',
  defaultPort: 7878,
  displayName: 'Radarr',
  description: 'Movie management and calendar',
  capabilities: ['calendar'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new RadarrIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);
