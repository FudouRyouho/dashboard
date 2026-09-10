import { PortainerIntegration } from './portainer-integration';
import type { IntegrationInput, IntegrationFactory, IntegrationMetadata } from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'portainer',
  defaultPort: 9000,
  displayName: 'Portainer',
  description: 'Docker management and monitoring',
  capabilities: ['docker'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new PortainerIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);
