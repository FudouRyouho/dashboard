import { ProwlarrIntegration } from './prowlarr-integration';
import type {
  IntegrationInput,
  IntegrationFactory,
  IntegrationMetadata,
} from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'prowlarr',
  defaultPort: 9696,
  displayName: 'Prowlarr',
  description: 'Indexer manager for torrent trackers',
  capabilities: ['indexerManager'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new ProwlarrIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);