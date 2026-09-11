import { DockerIntegration } from './docker-integration';
import type { IntegrationInput, IntegrationFactory, IntegrationMetadata } from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'docker',
  defaultPort: 2375,
  displayName: 'Docker',
  description: 'Docker management via socket/API',
  capabilities: ['docker'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new DockerIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);
